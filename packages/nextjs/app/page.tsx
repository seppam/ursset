"use client";

import { ActivityFeed } from "~~/components/ActivityFeed";
import { ShieldIcon } from "~~/components/Icons";
import { PropertyCard, PropertyCardSkeleton } from "~~/components/PropertyCard";
import { useT } from "~~/lib/i18n";
import { useProperties } from "~~/lib/properties";

const steps = [
  { n: 1, title: "Masuk", body: "Email atau Google, 10 detik" },
  { n: 2, title: "Isi saldo", body: "QRIS, mulai Rp10 ribu" },
  { n: 3, title: "Urunan", body: "Satu tap, kamu punya aset" },
];

export default function Home() {
  const t = useT();
  const { data: properties, isLoading } = useProperties();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-brand to-brand-deep p-5 text-white shadow-[var(--shadow-raised)] md:p-8">
        <span className="chip bg-white/15 text-white">{t("Demo · jaringan uji")}</span>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
          {t("3 langkah,")}
          <br />
          {t("kamu punya aset.")}
        </h1>
        <p className="mt-2 max-w-xl text-white/90">
          {t("Urunan bareng teman beli bagian rumah kos, terima sewanya tiap bulan, dan jual lagi kapan saja.")}
        </p>
        <a
          href="#properti"
          className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-6 font-bold text-brand-dark"
        >
          {t("Lihat properti")}
        </a>
        <p className="mt-3 text-xs text-white/80">{t("Tanpa dompet kripto, tanpa biaya gas untuk kamu.")}</p>
      </section>

      <section id="cara-kerja" className="scroll-mt-20">
        <h2 className="px-1 text-lg font-extrabold">{t("Cara kerja")}</h2>
        <ol className="mt-2 grid grid-cols-3 gap-2 md:gap-4">
          {steps.map(s => (
            <li key={s.n} className="card p-3 md:p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {s.n}
              </span>
              <p className="mt-2 text-sm font-extrabold">{t(s.title)}</p>
              <p className="text-xs text-muted md:text-sm">{t(s.body)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-brand-soft p-3 text-sm text-brand-deep">
          <ShieldIcon size={18} className="mt-0.5 shrink-0" />
          {t(
            "Bukti kepemilikan dan setoran sewa tercatat di blockchain, jadi siapa pun bisa memeriksanya. Wallet dibuat otomatis untukmu.",
          )}
        </p>
      </section>

      <section id="properti" className="scroll-mt-20 space-y-3">
        <h2 className="px-1 text-lg font-extrabold">{t("Properti tersedia")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </>
          )}
          {properties?.map(p => (
            <PropertyCard key={p.id} info={p} />
          ))}
        </div>
        {properties?.length === 0 && (
          <p className="card p-4 text-sm text-muted">
            {t("Belum ada properti. Pemilik bisa mendaftarkan lewat menu Kelola.")}
          </p>
        )}
      </section>

      <ActivityFeed />

      <p className="px-1 text-xs text-muted">
        {t(
          "Ini demo hackathon di jaringan uji dengan data ilustrasi dan Rupiah uji. Bukan penawaran investasi dan tidak ada imbal hasil yang dijanjikan.",
        )}
      </p>
    </div>
  );
}
