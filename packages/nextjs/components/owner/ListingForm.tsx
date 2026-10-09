"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoGrid, usePhotos } from "./photos";
import { Field, PropertyLink, Spinner, focusField, inputClass, translateServerError, useOwnerT } from "./ui";
import { type FieldKey, MAX_PHOTOS, type Problem, parseLinks, validateListing } from "./validate";
import { CityPicker } from "~~/components/CityPicker";
import { PlusIcon } from "~~/components/Icons";
import { IntInput } from "~~/components/IntInput";
import { txUrl } from "~~/lib/chain";
import { friendlyError, num, rp } from "~~/lib/format";

const DEFAULT_DOCS = "Sertifikat (SHGB atas nama SPV)\nPolis asuransi kebakaran\nLaporan keuangan 12 bulan terakhir";
const UNIT_PRICE = 10_000;
const EMPTY = {
  name: "",
  city: "",
  rooms: 12,
  occupancy: 90,
  totalValue: 2_000_000_000,
  about: "",
  documents: DEFAULT_DOCS,
};

type Done = { name: string; units: number; id: number; hash: string };

const LABELS: Record<FieldKey, string> = {
  passcode: "Kode operator",
  name: "Nama properti",
  city: "Kota",
  rooms: "Jumlah kamar",
  occupancy: "Okupansi",
  totalValue: "Nilai properti",
  photos: "Foto",
  links: "Link gambar",
};

function Step({ state, label }: { state: "wait" | "active" | "done"; label: string }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${state === "wait" ? "text-muted" : "font-semibold text-ink"}`}>
      {state === "active" ? (
        <Spinner className="text-brand" />
      ) : (
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${state === "done" ? "bg-brand text-white" : "border border-line"}`}
        >
          {state === "done" ? "✓" : ""}
        </span>
      )}
      {label}
    </li>
  );
}

/** Cover photo + name + units, so the owner sees what will be created before sending. */
function Preview({ name, city, cover, units }: { name: string; city: string; cover?: string; units: number }) {
  const t = useOwnerT();
  const [failed, setFailed] = useState<string | undefined>();
  const show = cover && failed !== cover;
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="relative flex h-32 items-end bg-gradient-to-br from-emerald-500 via-brand to-teal-700 p-3 text-white">
        {show && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setFailed(cover)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="relative">
          <p className="text-base font-black drop-shadow">{name.trim() || t("Nama properti")}</p>
          <p className="text-xs opacity-95">{city || t("Kota")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
        <span className="num font-semibold">{t("{n} unit @ {price}", { n: num(units), price: rp(UNIT_PRICE) })}</span>
        <span className="text-xs text-muted">{show ? t("Foto sampul") : t("Foto sampul belum ada")}</span>
      </div>
    </div>
  );
}

export function ListingForm({
  passcode,
  onPasscodeProblem,
}: {
  passcode: string;
  onPasscodeProblem: (msg: string) => void;
}) {
  const t = useOwnerT();
  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [linksText, setLinksText] = useState("");
  const [round, setRound] = useState(0);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState<{ text: string; field?: FieldKey; snap?: string } | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const doneCard = useRef<HTMLDivElement>(null);
  const photos = usePhotos(passcode);

  useEffect(() => {
    fetch("/api/upload")
      .then(r => r.json())
      .then(j => setUploadEnabled(Boolean(j.enabled)))
      .catch(() => setUploadEnabled(false));
  }, []);

  // Pasted links are only judged on submit, but once the owner has tried, errors update live and clear when fixed.
  const check = validateListing({ passcode, ...form, linksText, photos: photos.counts });
  const shown: Partial<Record<FieldKey, Problem>> = tried ? check.errors : {};
  const serverField = serverError?.field && serverError.snap === form.name ? serverError.field : undefined;
  const nameError: Problem | undefined =
    shown.name ?? (serverField === "name" ? { msg: serverError!.text } : undefined);
  const parsed = parseLinks(linksText);
  const linkTotal = parsed.urls.length;
  const slotsLeft = MAX_PHOTOS - photos.items.length - linkTotal;
  const units = Math.floor(form.totalValue / UNIT_PRICE);
  const cover = photos.items.find(p => p.status === "done")?.preview ?? parsed.urls[0];
  const set = (patch: Partial<typeof EMPTY>) => setForm(f => ({ ...f, ...patch }));
  const summary = tried ? check.invalid : [];

  async function submit() {
    setDone(null);
    setServerError(null);
    setTried(true);
    if (check.invalid.length > 0) {
      if (check.errors.passcode) onPasscodeProblem(check.errors.passcode.msg);
      focusField(check.invalid[0]);
      return;
    }
    setBusy(true);
    setStep(check.links.length > 0 ? 1 : 2);
    const timer = check.links.length > 0 ? setTimeout(() => setStep(2), 5000) : undefined;
    try {
      const res = await fetch("/api/listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          passcode,
          name: form.name.trim(),
          city: form.city,
          rooms: form.rooms,
          occupancy: form.occupancy,
          totalValue: form.totalValue,
          about: form.about,
          documents: form.documents.split("\n"),
          unitPrice: UNIT_PRICE,
          images: [...photos.items.filter(p => p.status === "done").map(p => p.url), ...check.links],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Gagal");
      setDone({
        name: form.name.trim(),
        units: Number(json.totalUnits ?? units),
        id: json.propertyId,
        hash: json.hash,
      });
      setForm(EMPTY);
      setLinksText("");
      setTried(false);
      setRound(r => r + 1);
      photos.reset();
      setTimeout(() => doneCard.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const text = translateServerError(friendlyError(e), t);
      if (raw.includes("Kode operator")) {
        onPasscodeProblem(text);
        setServerError({ text });
        focusField("passcode");
      } else if (raw.includes("Nama properti")) {
        setServerError({ text, field: "name", snap: form.name });
        focusField("name");
      } else setServerError({ text });
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  return (
    <section id="listing" className="card scroll-mt-20 p-5">
      <span className="chip">{t("Pemilik kos (demo)")}</span>
      <h2 className="mt-2 text-xl font-black">{t("Daftarkan properti baru")}</h2>
      <p className="text-sm text-muted">
        {t(
          "Pemilik mendaftarkan kos: kontrak token, penjualan, sewa, dan marketplace dipasang otomatis dalam satu transaksi.",
        )}
      </p>
      <p className="mt-2 text-xs text-muted">
        <span className="text-red-600" aria-hidden="true">
          *
        </span>{" "}
        {t("wajib diisi")}
      </p>

      {done && (
        <div
          ref={doneCard}
          role="status"
          className="mt-3 rounded-xl border border-brand/30 bg-brand-soft p-4 text-brand-deep"
        >
          <p className="font-black">{t("Properti terdaftar")}</p>
          <p className="mt-1 text-sm">
            {t("{name}: {n} unit dibuat @ {price}.", { name: done.name, n: num(done.units), price: rp(UNIT_PRICE) })}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <PropertyLink id={done.id} />
            <a className="font-semibold underline" href={txUrl(done.hash)} target="_blank" rel="noreferrer">
              {t("Lihat bukti di blockchain")}
            </a>
          </p>
        </div>
      )}

      <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4" aria-busy={busy}>
        <Field field="name" id="f-name" label="Nama properti" required error={nameError}>
          <input
            id="f-name"
            className={inputClass(!!nameError)}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "name-error" : undefined}
            value={form.name}
            maxLength={48}
            onChange={e => set({ name: e.target.value })}
            placeholder="Kos Anggrek Yogyakarta"
          />
        </Field>

        <Field
          field="city"
          label="Kota"
          required
          hint="Ketik untuk mencari, lalu pilih dari daftar."
          error={shown.city}
        >
          <div className="mt-1">
            <CityPicker
              key={round}
              className={inputClass(!!shown.city).replace("mt-1 ", "")}
              value={form.city}
              onChange={city => set({ city })}
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field field="rooms" id="f-rooms" label="Jumlah kamar" required hint="1 sampai 500" error={shown.rooms}>
            <IntInput
              id="f-rooms"
              className={inputClass(!!shown.rooms)}
              aria-invalid={!!shown.rooms}
              value={form.rooms}
              onChange={rooms => set({ rooms })}
            />
          </Field>
          <Field field="occupancy" id="f-occ" label="Okupansi (%)" required hint="0 sampai 100" error={shown.occupancy}>
            <IntInput
              id="f-occ"
              className={inputClass(!!shown.occupancy)}
              aria-invalid={!!shown.occupancy}
              value={form.occupancy}
              onChange={occupancy => set({ occupancy })}
            />
          </Field>
        </div>

        <Field
          field="totalValue"
          id="f-value"
          label="Nilai properti (Rp)"
          required
          hint="Rp100 juta sampai Rp100 miliar"
          error={shown.totalValue}
        >
          <IntInput
            id="f-value"
            className={inputClass(!!shown.totalValue)}
            aria-invalid={!!shown.totalValue}
            value={form.totalValue}
            onChange={totalValue => set({ totalValue })}
          />
          <p className="num mt-1 text-xs font-semibold text-ink">{rp(form.totalValue)}</p>
        </Field>

        <Field field="about" id="f-about" label="Deskripsi" optional>
          <textarea
            id="f-about"
            className={inputClass()}
            rows={3}
            maxLength={600}
            value={form.about}
            onChange={e => set({ about: e.target.value })}
          />
        </Field>

        <Field field="documents" id="f-docs" label="Dokumen (satu per baris)" optional>
          <textarea
            id="f-docs"
            className={inputClass()}
            rows={3}
            value={form.documents}
            onChange={e => set({ documents: e.target.value })}
          />
        </Field>

        <div className="rounded-xl bg-slate-50 p-3">
          <Field
            field="photos"
            label="Foto dari perangkat"
            required
            hint="Minimal 1 foto, maksimal 6. Boleh digabung dengan link gambar di bawah."
            error={shown.photos}
          >
            <div className="mt-2">
              <button
                type="button"
                className="btn-ghost w-full border border-line bg-white"
                disabled={uploadEnabled !== true || slotsLeft <= 0}
                onClick={() => fileInput.current?.click()}
              >
                <PlusIcon size={16} />
                {photos.counts.uploading > 0 ? t("Mengunggah…") : t("Unggah foto")}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                tabIndex={-1}
                onChange={e => {
                  photos.add(e.target.files, linkTotal);
                  e.target.value = "";
                }}
              />
              {uploadEnabled === false && (
                <p className="mt-1 text-xs text-muted">
                  {t("Unggah foto belum aktif (Vercel Blob belum disambungkan). Tempel link gambar saja.")}
                </p>
              )}
              <PhotoGrid photos={photos} disabled={busy} />
            </div>
          </Field>

          <div className="mt-4">
            <Field
              field="links"
              id="f-links"
              label="Atau dari link gambar (satu per baris)"
              optional
              hint="Tempel alamat gambar (diawali https://). Link diperiksa dan disalin saat kamu menekan Daftarkan."
              error={shown.links}
            >
              <textarea
                id="f-links"
                className={inputClass(!!shown.links)}
                rows={3}
                value={linksText}
                aria-invalid={!!shown.links}
                aria-describedby={shown.links ? "links-error" : undefined}
                onChange={e => setLinksText(e.target.value)}
                placeholder="https://contoh.com/foto-kos.jpg"
                spellCheck={false}
                autoCapitalize="none"
              />
            </Field>
            {tried && check.badLines.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-red-600">
                {check.badLines.map(b => (
                  <li key={b.line} className="break-all">
                    {t("Baris {n} tidak valid: {text}", { n: b.line, text: b.text })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-ink">{t("Pratinjau")}</p>
          <div className="mt-1">
            <Preview name={form.name} city={form.city} cover={cover} units={units} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {t("Unit akan dibuat: {n} unit @ {price}", { n: num(units), price: rp(UNIT_PRICE) })}
          </p>
        </div>
      </fieldset>

      {summary.length > 0 && !busy && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <span className="font-semibold">{t("Lengkapi")}:</span> {summary.map(k => t(LABELS[k])).join(", ")}
        </p>
      )}
      {serverError && !busy && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {serverError.text}
        </p>
      )}

      {busy && (
        <ol className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3" aria-live="polite">
          <Step
            state={step === 1 ? "active" : "done"}
            label={check.links.length > 0 ? t("Mengunggah/menyalin foto") : t("Foto siap")}
          />
          <Step state={step === 2 ? "active" : "wait"} label={t("Memasang kontrak di blockchain")} />
        </ol>
      )}

      <button className="btn-main mt-4" disabled={busy} onClick={submit}>
        {busy ? (
          <>
            <Spinner />
            {t("Mendaftarkan…")}
          </>
        ) : (
          t("Daftarkan properti")
        )}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        {t("Demo di jaringan uji. Data ilustrasi, bukan penawaran investasi.")}
      </p>
    </section>
  );
}
