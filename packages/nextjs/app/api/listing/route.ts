import { put } from "@vercel/blob";
import { HttpError, type ListingInput, fail, listProperty, requireOperatorCode } from "~~/lib/server/operator";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

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
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
};

const isOurBlob = (u: string) => new URL(u).hostname.endsWith(".public.blob.vercel-storage.com");

/**
 * Copies a pasted image link into our own storage. Many sites block hotlinking, so a link that works in
 * the owner's browser would show up broken for everyone else; a copy we host always loads.
 */
async function rehost(source: string): Promise<string> {
  if (isOurBlob(source)) return source;
  let res: Response;
  try {
    res = await fetch(source, {
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; URSSET/1.0)", accept: "image/*" },
    });
  } catch {
    throw new HttpError(400, "Link gambar tidak bisa dibuka. Coba unggah file atau pakai link lain.");
  }
  const type = res.headers.get("content-type")?.split(";")[0] ?? "";
  if (!res.ok || !type.startsWith("image/"))
    throw new HttpError(
      400,
      "Link itu bukan gambar langsung. Klik kanan gambarnya lalu salin alamat gambar, atau unggah file.",
    );
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new HttpError(400, "Gambar maksimal 4 MB");
  const ext = type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "img";
  const blob = await put(`properties/${Date.now()}-link.${ext}`, bytes, {
    access: "public",
    contentType: type,
    addRandomSuffix: true,
  });
  return blob.url;
}

/** Lists a new property: validates the form, stores the metadata JSON, then deploys the contracts via the factory. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    requireOperatorCode(body.passcode);

    const unitPrice = int(body.unitPrice ?? 10_000, 1000, 1_000_000, "Harga unit");
    const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    const pasted = (Array.isArray(body.images) ? body.images : [])
      .map(url)
      .filter((u: string | null): u is string => !!u)
      .slice(0, 6);
    const images = hasBlob ? await Promise.all(pasted.map(rehost)) : pasted;

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
