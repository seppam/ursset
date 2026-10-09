import { put } from "@vercel/blob";
import { blobToken } from "~~/lib/server/blob";
import { clientIp, rateLimit } from "~~/lib/server/guard";
import { HttpError, fail, requireOperatorCode } from "~~/lib/server/operator";

const MAX_BYTES = 4 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Checks the file's first bytes, so a renamed HTML/SVG file cannot pass with a spoofed Content-Type. */
function matchesType(b: Uint8Array, type: string) {
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === "image/png") return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  return String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP";
}

/** Stores one property photo in Vercel Blob and returns its public URL. Needs the BLOB_READ_WRITE_TOKEN env. */
export async function POST(req: Request) {
  try {
    rateLimit(`upload-ip:${clientIp(req)}`, 30, 10 * 60_000);
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES + 100_000) throw new HttpError(413, "Gambar maksimal 4 MB");
    const form = await req.formData();
    await requireOperatorCode(req, form.get("passcode"));
    const token = blobToken();
    if (!token) throw new HttpError(501, "Unggah foto belum aktif");
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "File tidak ditemukan");
    if (!EXT[file.type]) throw new HttpError(400, "Hanya gambar JPEG, PNG, atau WebP");
    if (file.size > MAX_BYTES) throw new HttpError(400, "Gambar maksimal 4 MB");
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!matchesType(head, file.type)) throw new HttpError(400, "Hanya gambar JPEG, PNG, atau WebP");
    const blob = await put(`properties/${Date.now()}-photo.${EXT[file.type]}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
      token,
    });
    return Response.json({ ok: true, url: blob.url });
  } catch (e) {
    return fail(e);
  }
}

export async function GET() {
  return Response.json({ enabled: Boolean(blobToken()) });
}
