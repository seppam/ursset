"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CityPicker } from "~~/components/CityPicker";
import { IntInput } from "~~/components/IntInput";
import { txUrl } from "~~/lib/chain";
import { friendlyError, num, rp } from "~~/lib/format";
import { useSaleInfo } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { PropertyProvider, useMetaMap, useProp, useProperties } from "~~/lib/properties";

type Result = { ok: boolean; text: string; hash?: string; link?: string };

const field = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink";

function Banner({ result }: { result: Result | null }) {
  const t = useT();
  if (!result) return null;
  return (
    <p
      className={`mt-3 rounded-lg p-2 text-sm ${result.ok ? "bg-brand-soft text-brand-dark" : "bg-red-50 text-red-700"}`}
    >
      {result.text}{" "}
      {result.hash && (
        <a className="font-semibold underline" href={txUrl(result.hash)} target="_blank" rel="noreferrer">
          {t("bukti")}
        </a>
      )}{" "}
      {result.link && (
        <Link className="font-semibold underline" href={result.link}>
          {t("Lihat halaman properti")}
        </Link>
      )}
    </p>
  );
}

function RentForm({ passcode }: { passcode: string }) {
  const t = useT();
  const info = useSaleInfo();
  const { info: prop } = useProp();
  const [perUnit, setPerUnit] = useState(100);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const circulating = Number(info.circulating ?? 0n);
  const amount = circulating * perUnit;

  async function deposit() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/rent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode, propertyId: prop.id, amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal");
      setResult({ ok: true, text: t("Sewa {amount} dibagikan.", { amount: rp(amount) }), hash: json.hash });
      void info.refetch();
    } catch (e) {
      setResult({ ok: false, text: t(friendlyError(e)) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <dl className="mt-3 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">{t("Unit beredar")}</dt>
          <dd className="font-semibold">{num(circulating)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{t("Sudah dibagikan sejauh ini")}</dt>
          <dd className="font-semibold">{rp(info.rentPaid)}</dd>
        </div>
      </dl>
      <label className="mt-3 block text-xs font-semibold text-muted">
        {t("Sewa per unit (Rp)")}
        <IntInput className={field} value={perUnit} onChange={setPerUnit} />
      </label>
      <button
        className="btn-main mt-4"
        disabled={busy || circulating === 0 || perUnit < 1 || !passcode}
        onClick={deposit}
      >
        {busy ? t("Memproses…") : t("Setor {amount}", { amount: rp(amount) })}
      </button>
      <Banner result={result} />
    </>
  );
}

const DEFAULT_DOCS = "Sertifikat (SHGB atas nama SPV)\nPolis asuransi kebakaran\nLaporan keuangan 12 bulan terakhir";

/** Shrinks a photo in the browser so uploads stay small and fast. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Gagal memproses gambar"))), "image/jpeg", 0.82),
  );
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative">
      {failed ? (
        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-red-50 px-1 text-center text-[10px] text-red-700">
          {t("Gambar tidak dapat dimuat")}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-20 w-full rounded-lg object-cover"
        />
      )}
      <button
        className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
        onClick={onRemove}
        aria-label={t("Hapus")}
      >
        ×
      </button>
    </div>
  );
}

function ListingForm({ passcode }: { passcode: string }) {
  const t = useT();
  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    name: "",
    city: "",
    rooms: 12,
    occupancy: 90,
    totalValue: 2_000_000_000,
    about: "",
    documents: DEFAULT_DOCS,
  });
  const [images, setImages] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const unitPrice = 10_000;

  useEffect(() => {
    fetch("/api/upload")
      .then(r => r.json())
      .then(j => setUploadEnabled(Boolean(j.enabled)))
      .catch(() => setUploadEnabled(false));
  }, []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setResult(null);
    try {
      for (const file of Array.from(files).slice(0, 6 - images.length)) {
        const body = new FormData();
        body.set("passcode", passcode);
        body.set(
          "file",
          new File([await shrink(file)], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }),
        );
        const res = await fetch("/api/upload", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal mengunggah");
        setImages(prev => [...prev, json.url]);
      }
    } catch (e) {
      setResult({ ok: false, text: t(friendlyError(e)) });
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode, ...form, unitPrice, images, documents: form.documents.split("\n") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal");
      setResult({ ok: true, text: t("Properti terdaftar."), hash: json.hash, link: `/p/${json.propertyId}` });
    } catch (e) {
      setResult({ ok: false, text: t(friendlyError(e)) });
    } finally {
      setBusy(false);
    }
  }

  const units = Math.floor(form.totalValue / unitPrice);

  return (
    <section id="listing" className="card scroll-mt-20 p-5">
      <span className="chip">{t("Pemilik kos (demo)")}</span>
      <h2 className="mt-2 text-xl font-black">{t("Daftarkan properti baru")}</h2>
      <p className="text-sm text-muted">
        {t(
          "Pemilik mendaftarkan kos: kontrak token, penjualan, sewa, dan marketplace dipasang otomatis dalam satu transaksi.",
        )}
      </p>

      <div className="mt-3 grid gap-3">
        <label className="text-xs font-semibold text-muted">
          {t("Nama properti")}
          <input
            className={field}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Kos Anggrek Yogyakarta"
          />
        </label>
        <div className="text-xs font-semibold text-muted">
          {t("Kota")}
          <div className="mt-1">
            <CityPicker
              className={field.replace("mt-1 ", "")}
              value={form.city}
              onChange={city => setForm({ ...form, city })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-muted">
            {t("Jumlah kamar")}
            <IntInput className={field} value={form.rooms} onChange={rooms => setForm({ ...form, rooms })} />
          </label>
          <label className="text-xs font-semibold text-muted">
            {t("Okupansi (%)")}
            <IntInput
              className={field}
              value={form.occupancy}
              onChange={occupancy => setForm({ ...form, occupancy: Math.min(100, occupancy) })}
            />
          </label>
        </div>
        <label className="text-xs font-semibold text-muted">
          {t("Nilai properti (Rp)")}
          <IntInput
            className={field}
            value={form.totalValue}
            onChange={totalValue => setForm({ ...form, totalValue })}
          />
        </label>
        <p className="-mt-1 text-xs text-muted">
          {t("Unit akan dibuat: {n} unit @ {price}", { n: num(units), price: rp(unitPrice) })}
        </p>
        <label className="text-xs font-semibold text-muted">
          {t("Deskripsi")}
          <textarea
            className={field}
            rows={3}
            value={form.about}
            onChange={e => setForm({ ...form, about: e.target.value })}
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          {t("Dokumen (satu per baris)")}
          <textarea
            className={field}
            rows={3}
            value={form.documents}
            onChange={e => setForm({ ...form, documents: e.target.value })}
          />
        </label>

        <div>
          <p className="text-xs font-semibold text-muted">{t("Foto")}</p>
          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {images.map(src => (
                <Thumb key={src} src={src} onRemove={() => setImages(images.filter(i => i !== src))} />
              ))}
            </div>
          )}
          {uploadEnabled ? (
            <label className="btn-ghost mt-2 w-full cursor-pointer">
              {uploading ? t("Mengunggah…") : t("Unggah foto")}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading || images.length >= 6}
                onChange={e => upload(e.target.files)}
              />
            </label>
          ) : (
            uploadEnabled === false && (
              <p className="mt-1 text-xs text-muted">
                {t("Unggah foto belum aktif (Vercel Blob belum disambungkan). Tempel link gambar saja.")}
              </p>
            )
          )}
          <div className="mt-2 flex gap-2">
            <input
              className={field.replace("mt-1 ", "")}
              placeholder={t("atau tempel link gambar")}
              value={link}
              onChange={e => setLink(e.target.value)}
            />
            <button
              className="btn-ghost"
              disabled={!/^https?:\/\//.test(link) || images.length >= 6}
              onClick={() => {
                setImages([...images, link.trim()]);
                setLink("");
              }}
            >
              {t("Tambah")}
            </button>
          </div>
        </div>
      </div>

      <button
        className="btn-main mt-4"
        disabled={busy || uploading || !passcode || form.name.trim().length < 3 || !form.city}
        onClick={submit}
      >
        {busy ? t("Mendaftarkan di blockchain…") : t("Daftarkan properti")}
      </button>
      <Banner result={result} />
    </section>
  );
}

export default function Operator() {
  const t = useT();
  const { data: properties } = useProperties();
  const metas = useMetaMap(properties);
  const [passcode, setPasscode] = useState("");
  const [selected, setSelected] = useState(0);
  const current = properties?.find(p => p.id === selected) ?? properties?.[0];

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <label className="block text-xs font-semibold text-muted">
          {t("Kode operator")}
          <input type="password" value={passcode} onChange={e => setPasscode(e.target.value)} className={field} />
        </label>
      </section>

      <section id="rent" className="card scroll-mt-20 p-5">
        <span className="chip">{t("Pemilik kos (demo)")}</span>
        <h1 className="mt-2 text-2xl font-black">{t("Setor sewa bulan ini")}</h1>
        <p className="text-sm text-muted">
          {t("Sewa dibagi ke semua unit yang sudah terjual. Unit yang belum terjual tidak menerima sewa.")}
        </p>
        <label className="mt-3 block text-xs font-semibold text-muted">
          {t("Properti")}
          <select className={field} value={current?.id ?? 0} onChange={e => setSelected(Number(e.target.value))}>
            {metas.map(({ info, meta }) => (
              <option key={info.id} value={info.id}>
                {meta?.name ?? `#${info.id + 1}`}
              </option>
            ))}
          </select>
        </label>
        {current && (
          <PropertyProvider key={current.id} info={current}>
            <RentForm passcode={passcode} />
          </PropertyProvider>
        )}
      </section>

      <ListingForm passcode={passcode} />
    </div>
  );
}
