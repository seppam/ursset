import { put } from "@vercel/blob";
import { HttpError, type ListingInput, fail, listProperty, requireOperatorCode } from "~~/lib/server/operator";

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

/** Lists a new property: validates the form, stores the metadata JSON, then deploys the contracts via the factory. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    requireOperatorCode(body.passcode);

    const unitPrice = int(body.unitPrice ?? 10_000, 1000, 1_000_000, "Harga unit");
    const input: ListingInput = {
      name: text(body.name, 48),
      city: text(body.city, 48),
      rooms: int(body.rooms, 1, 500, "Jumlah kamar"),
      occupancy: int(body.occupancy, 0, 100, "Okupansi"),
      totalValue: int(body.totalValue, 100_000_000, 100_000_000_000, "Nilai properti"),
      about: text(body.about, 600),
      images: (Array.isArray(body.images) ? body.images : [])
        .map(url)
        .filter((u: string | null): u is string => !!u)
        .slice(0, 6),
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
    if (process.env.BLOB_READ_WRITE_TOKEN) {
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
