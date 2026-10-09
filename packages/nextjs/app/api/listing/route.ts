import { put } from "@vercel/blob";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { blobToken } from "~~/lib/server/blob";
import { clientIp, isPrivateIp, rateLimit } from "~~/lib/server/guard";
import { HttpError, type ListingInput, fail, listProperty, requireOperatorCode } from "~~/lib/server/operator";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const text = (v: unknown, max: number) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const int = (v: unknown, min: number, max: number, label: string) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `${label} harus antara ${min} dan ${max}`);
  return Math.floor(n);
};
const url = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

const isOurBlob = (u: string) => new URL(u).hostname.endsWith(".public.blob.vercel-storage.com");

/** Rejects hosts that are not public https (localhost, private/link-local/metadata addresses). */
async function assertPublicHost(u: URL) {
  if (u.protocol !== "https:" || (u.port && u.port !== "443")) throw new HttpError(400, "Link gambar harus https");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal"))
    throw new HttpError(400, "Link gambar tidak diizinkan");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) throw new HttpError(400, "Link gambar tidak diizinkan");
}

/** Reads a body but gives up as soon as it passes the limit, so a chunked response cannot exhaust memory. */
async function readLimited(res: Response, max: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new HttpError(400, "Gambar maksimal 4 MB");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Copies a pasted image link into our own storage. Many sites block hotlinking, so a link that works in
 * the owner's browser would show up broken for everyone else; a copy we host always loads.
 * Only public https hosts are fetched, and redirects are followed by hand so every hop is checked again.
 * Residual risk: DNS may answer differently between our check and the fetch (rebinding); the route sits
 * behind the operator code, which is why this was left as is.
 */
async function rehost(source: string, token: string): Promise<string> {
  if (isOurBlob(source)) return source;
  let res!: Response;
  try {
    let target = new URL(source);
    for (let hop = 0; ; hop++) {
      await assertPublicHost(target);
      res = await fetch(target, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; URSSET/1.0)", accept: "image/jpeg,image/png,image/webp" },
      });
      const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!next) break;
      if (hop >= MAX_REDIRECTS) throw new HttpError(400, "Link gambar terlalu banyak pengalihan");
      target = new URL(next, target);
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Link gambar tidak bisa dibuka. Coba unggah file atau pakai link lain.");
  }
  const type = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!res.ok || !IMAGE_TYPES.has(type))
    throw new HttpError(
      400,
      "Link itu bukan gambar langsung. Klik kanan gambarnya lalu salin alamat gambar, atau unggah file.",
    );
  if (Number(res.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES)
    throw new HttpError(400, "Gambar maksimal 4 MB");
  const bytes = await readLimited(res, MAX_IMAGE_BYTES);
  const ext = type === "image/jpeg" ? "jpg" : type.split("/")[1];
  const blob = await put(`properties/${Date.now()}-link.${ext}`, bytes, {
    access: "public",
    contentType: type,
    addRandomSuffix: true,
    token,
  });
  return blob.url;
}

/** Lists a new property: validates the form, stores the metadata JSON, then deploys the contracts via the factory. */
export async function POST(req: Request) {
  try {
    rateLimit(`listing-ip:${clientIp(req)}`, 10, 10 * 60_000);
    const body = await req.json();
    await requireOperatorCode(req, body.passcode);

    const unitPrice = int(body.unitPrice ?? 10_000, 1000, 1_000_000, "Harga unit");
    const token = blobToken();
    const hasBlob = Boolean(token);
    const pasted = (Array.isArray(body.images) ? body.images : [])
      .map(url)
      .filter((u: string | null): u is string => !!u)
      .slice(0, 6);
    const images = hasBlob ? await Promise.all(pasted.map((u: string) => rehost(u, token!))) : pasted;

    const input: ListingInput = {
      name: text(body.name, 48),
      city: text(body.city, 48),
      rooms: int(body.rooms, 1, 500, "Jumlah kamar"),
      occupancy: int(body.occupancy, 0, 100, "Okupansi"),
      totalValue: int(body.totalValue, 100_000_000, 100_000_000_000, "Nilai properti"),
      about: text(body.about, 600),
      images,
      documents: (Array.isArray(body.documents) ? body.documents : [])
        .map((d: unknown) => text(d, 80))
        .filter(Boolean)
        .slice(0, 6),
      unitPrice,
    };
    if (input.name.length < 3) throw new HttpError(400, "Nama properti terlalu pendek");
    if (input.totalValue / unitPrice > 10_000_000) throw new HttpError(400, "Jumlah unit terlalu besar");

    const meta = {
      name: input.name,
      city: input.city,
      rooms: input.rooms,
      occupancy: input.occupancy,
      totalValue: input.totalValue,
      about: input.about,
      images: input.images,
      documents: input.documents.length ? input.documents : ["Dokumen akan dilampirkan oleh pemilik"],
    };
    const json = JSON.stringify(meta);

    // With Vercel Blob the JSON gets a short public URL; without it, the JSON travels inside the onchain URI.
    let metadataURI: string;
    if (hasBlob) {
      const blob = await put(`properties/${Date.now()}-meta.json`, json, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: true,
        token,
      });
      metadataURI = blob.url;
    } else {
      if (json.length > 6000)
        throw new HttpError(400, "Data terlalu besar tanpa Vercel Blob; kurangi jumlah foto atau deskripsi");
      metadataURI = `data:application/json;base64,${Buffer.from(json).toString("base64")}`;
    }

    const { hash, propertyId, totalUnits } = await listProperty(input, metadataURI, json);
    return Response.json({ ok: true, hash, propertyId, totalUnits: Number(totalUnits) });
  } catch (e) {
    return fail(e);
  }
}
