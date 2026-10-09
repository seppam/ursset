/** Pure validation for the owner forms, so it can run without React. Messages are Indonesian i18n keys. */

export const MAX_PHOTOS = 6;
export const MIN_VALUE = 100_000_000;
export const MAX_VALUE = 100_000_000_000;

export type Problem = { msg: string; vars?: Record<string, string | number> };
export type FieldKey = "passcode" | "name" | "city" | "rooms" | "occupancy" | "totalValue" | "photos" | "links";

/** Order in which fields appear on the page: the first invalid one gets focus. */
export const FIELD_ORDER: FieldKey[] = [
  "passcode",
  "name",
  "city",
  "rooms",
  "occupancy",
  "totalValue",
  "photos",
  "links",
];

export type BadLine = { line: number; text: string };

/** Splits pasted image links (one per line) into valid http/https URLs and the lines that are not. */
export function parseLinks(text: string): { urls: string[]; bad: BadLine[] } {
  const urls: string[] = [];
  const bad: BadLine[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let ok = false;
    try {
      const u = new URL(line);
      ok = (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
      if (ok && !urls.includes(u.toString())) urls.push(u.toString());
    } catch {
      ok = false;
    }
    if (!ok) bad.push({ line: i + 1, text: line });
  });
  return { urls, bad };
}

export type ListingDraft = {
  passcode: string;
  name: string;
  city: string;
  rooms: number;
  occupancy: number;
  totalValue: number;
  linksText: string;
  photos: { done: number; uploading: number; failed: number };
};

export type ListingCheck = {
  errors: Partial<Record<FieldKey, Problem>>;
  /** Fields with a problem, in page order. */
  invalid: FieldKey[];
  links: string[];
  badLines: BadLine[];
};

export function validateListing(d: ListingDraft): ListingCheck {
  const errors: ListingCheck["errors"] = {};
  const { urls, bad } = parseLinks(d.linksText);

  if (!d.passcode.trim()) errors.passcode = { msg: "Isi Kode operator" };
  if (d.name.trim().length < 3) errors.name = { msg: "Nama properti minimal 3 huruf" };
  if (!d.city) errors.city = { msg: "Pilih kota dari daftar" };
  if (!Number.isInteger(d.rooms) || d.rooms < 1 || d.rooms > 500) errors.rooms = { msg: "Isi 1 sampai 500 kamar" };
  if (!Number.isInteger(d.occupancy) || d.occupancy < 0 || d.occupancy > 100)
    errors.occupancy = { msg: "Isi 0 sampai 100 persen" };
  if (!Number.isInteger(d.totalValue) || d.totalValue < MIN_VALUE || d.totalValue > MAX_VALUE)
    errors.totalValue = { msg: "Nilai harus antara Rp100 juta dan Rp100 miliar" };

  const total = d.photos.done + urls.length;
  if (d.photos.uploading > 0) errors.photos = { msg: "Tunggu sampai unggahan foto selesai" };
  else if (d.photos.failed > 0) errors.photos = { msg: "Ada foto yang gagal. Coba lagi atau hapus foto itu." };
  else if (total === 0) errors.photos = { msg: "Tambahkan minimal 1 foto (unggah dari perangkat atau dari link)" };
  else if (total > MAX_PHOTOS)
    errors.photos = { msg: "Maksimal {max} foto. Kurangi {n} foto.", vars: { max: MAX_PHOTOS, n: total - MAX_PHOTOS } };

  if (bad.length > 0) errors.links = { msg: "Ada link gambar yang tidak valid. Periksa baris yang ditandai." };

  return { errors, invalid: FIELD_ORDER.filter(k => errors[k]), links: urls, badLines: bad };
}

export function validateRent(d: { passcode: string; perUnit: number }) {
  const errors: Partial<Record<"passcode" | "perUnit", Problem>> = {};
  if (!d.passcode.trim()) errors.passcode = { msg: "Isi Kode operator" };
  if (!Number.isInteger(d.perUnit) || d.perUnit < 1) errors.perUnit = { msg: "Isi sewa per unit, minimal Rp1" };
  return errors;
}
