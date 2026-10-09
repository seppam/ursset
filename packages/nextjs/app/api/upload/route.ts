import { put } from "@vercel/blob";
import { HttpError, fail, requireOperatorCode } from "~~/lib/server/operator";

const MAX_BYTES = 4 * 1024 * 1024;

/** Stores one property photo in Vercel Blob and returns its public URL. Needs the BLOB_READ_WRITE_TOKEN env. */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    requireOperatorCode(form.get("passcode"));
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(501, "Unggah foto belum aktif");
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "File tidak ditemukan");
    if (!file.type.startsWith("image/")) throw new HttpError(400, "Hanya file gambar");
    if (file.size > MAX_BYTES) throw new HttpError(400, "Gambar maksimal 4 MB");
    const safe = file.name.replace(/[^a-z0-9.]+/gi, "-").slice(-60);
    const blob = await put(`properties/${Date.now()}-${safe}`, file, { access: "public", addRandomSuffix: true });
    return Response.json({ ok: true, url: blob.url });
  } catch (e) {
    return fail(e);
  }
}

export async function GET() {
  return Response.json({ enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}
