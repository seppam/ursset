"use client";

import { useState } from "react";
import Link from "next/link";
import { useExportWallet, usePrivy } from "@privy-io/react-auth";
import { TopUp } from "~~/components/TopUp";
import { EXPLORER_URL, addressUrl, txUrl } from "~~/lib/chain";
import { friendlyError, num, rp, short } from "~~/lib/format";
import { type HistoryItem, type HistoryKind, useHistory } from "~~/lib/history";
import { useMe } from "~~/lib/hooks";
import { useI18n } from "~~/lib/i18n";
import { useMetaMap, useProperties } from "~~/lib/properties";

type Filter = "all" | "saldo" | "urunan" | "sewa" | "jual" | "transfer";

const FILTERS: { id: Filter; label: string; kinds: HistoryKind[] }[] = [
  { id: "all", label: "Semua", kinds: [] },
  { id: "saldo", label: "Saldo", kinds: ["topup"] },
  { id: "urunan", label: "Urunan", kinds: ["buy", "bought"] },
  { id: "sewa", label: "Sewa", kinds: ["claim"] },
  { id: "jual", label: "Jual", kinds: ["list", "sold"] },
  { id: "transfer", label: "Transfer", kinds: ["send", "receive"] },
];

const TITLE: Record<HistoryKind, string> = {
  topup: "Isi saldo",
  buy: "Urunan",
  bought: "Beli di pasar sekunder",
  claim: "Sewa diambil",
  list: "Pasang penawaran jual",
  sold: "Unit terjual",
  send: "Kirim unit",
  receive: "Terima unit",
};

const SIGN: Partial<Record<HistoryKind, "+" | "-">> = { topup: "+", claim: "+", sold: "+", buy: "-", bought: "-" };

function Row({ item, name }: { item: HistoryItem; name?: string }) {
  const { t, lang } = useI18n();
  const sign = SIGN[item.kind];
  const when = item.time
    ? new Date(item.time * 1000).toLocaleString(lang === "en" ? "en-GB" : "id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const detail =
    item.kind === "list"
      ? t("{n} unit @ {price}", { n: num(item.units), price: rp(item.amount) })
      : item.units !== undefined
        ? t("{n} unit", { n: num(item.units) })
        : "";
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold">{t(TITLE[item.kind])}</p>
        <p className="truncate text-xs text-muted">{[name, detail, when].filter(Boolean).join(" · ")}</p>
        <a
          className="text-xs font-semibold text-brand underline"
          href={txUrl(item.hash)}
          target="_blank"
          rel="noreferrer"
        >
          {t("Lihat bukti di blockchain")}
        </a>
      </div>
      {item.amount !== undefined && item.kind !== "list" && (
        <p className={`shrink-0 text-sm font-extrabold ${sign === "+" ? "text-brand-dark" : ""}`}>
          {sign}
          {rp(item.amount)}
        </p>
      )}
    </li>
  );
}

function Guide({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-line bg-white px-4 py-3">
      <summary className="flex min-h-[28px] cursor-pointer list-none items-center justify-between text-sm font-bold">
        {title}
        <span aria-hidden className="text-muted transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-2 space-y-2 text-sm text-muted">{children}</div>
    </details>
  );
}

export default function Profile() {
  const { t } = useI18n();
  const { ready, authenticated, login, user } = usePrivy();
  const { exportWallet } = useExportWallet();
  const me = useMe();
  const { data: properties } = useProperties();
  const names = new Map(useMetaMap(properties).map(({ info, meta }) => [info.id, meta?.name ?? `#${info.id + 1}`]));
  const history = useHistory(me.address);
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState("");

  if (!authenticated) {
    return (
      <div className="card mx-auto mt-4 max-w-md p-6 text-center">
        <h1 className="text-xl font-extrabold">{t("Profil")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Masuk untuk melihat dompet, saldo, dan riwayat transaksimu.")}</p>
        <button className="btn-main mt-4" disabled={!ready} onClick={login}>
          {t("Masuk")}
        </button>
      </div>
    );
  }

  const account = user?.email?.address ?? user?.google?.email ?? "";
  const active = FILTERS.find(f => f.id === filter)!;
  const rows = (history.data ?? []).filter(i => active.kinds.length === 0 || active.kinds.includes(i.kind));

  async function copy() {
    if (!me.address) return;
    await navigator.clipboard.writeText(me.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function exportKey() {
    setExportError("");
    try {
      await exportWallet(me.address ? { address: me.address } : undefined);
    } catch (e) {
      setExportError(t(friendlyError(e)));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="card p-5">
        <p className="eyebrow">{t("Akunmu")}</p>
        <p className="truncate text-lg font-extrabold">{account || short(me.address)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={me.verified ? "chip" : "chip-neutral"}>
            {me.verified ? t("Terverifikasi") : t("Belum terverifikasi")}
          </span>
          <span className="chip-neutral">{t("Data uji")}</span>
        </div>
        <p className="mt-4 text-sm text-muted">{t("Saldo Rupiah uji")}</p>
        <p className="text-3xl font-black">{rp(me.idr)}</p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-extrabold">{t("Isi saldo")}</h2>
        <div className="mt-2">
          <TopUp />
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-bold">{t("Tarik saldo ke Rupiah")}</p>
          <p className="text-muted">
            {t(
              "Belum tersedia di demo: saldo ini adalah Rupiah uji (tIDR) dan tidak bisa ditarik. Cara kerjanya di versi produksi ada di panduan di bawah.",
            )}
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-extrabold">{t("Dompet kamu")}</h2>
        <p className="text-sm text-muted">
          {t("Dompet dibuat otomatis saat kamu masuk. Alamat ini publik dan aman dibagikan; kuncinya tidak.")}
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold text-muted">{t("Alamat")}</dt>
            <dd className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs">{me.address}</code>
              <button className="btn-ghost shrink-0" onClick={copy}>
                {copied ? t("Tersalin") : t("Salin")}
              </button>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("Jaringan")}</dt>
            <dd className="font-semibold">Robinhood Chain Testnet (46630)</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("Biaya jaringan")}</dt>
            <dd className="font-semibold">{t("Ditanggung URSSET")}</dd>
          </div>
        </dl>
        {me.address && (
          <a className="btn-ghost mt-3 w-full" href={addressUrl(me.address)} target="_blank" rel="noreferrer">
            {t("Lihat dompet di explorer")}
          </a>
        )}
        <div className="mt-3">
          <button className="btn-ghost w-full" onClick={exportKey}>
            {t("Ekspor kunci dompet")}
          </button>
          <p className="mt-1 text-xs text-muted">
            {t(
              "Kunci ditampilkan di jendela aman milik Privy, bukan oleh URSSET. Simpan dan jangan bagikan ke siapa pun.",
            )}
          </p>
          {exportError && <p className="mt-1 text-xs text-red-700">{exportError}</p>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-extrabold">{t("Riwayat transaksi")}</h2>
        <p className="text-sm text-muted">
          {t("Dibaca langsung dari blockchain, jadi setiap baris punya bukti yang bisa dicek siapa pun.")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-[36px] rounded-full border px-3 text-xs font-bold ${filter === f.id ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-muted"}`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
        {history.isLoading && <div className="skeleton mt-3 h-24" />}
        {!history.isLoading && rows.length === 0 && (
          <p className="mt-3 text-sm text-muted">{t("Belum ada transaksi di kategori ini.")}</p>
        )}
        <ul className="mt-2 divide-y divide-line">
          {rows.map(i => (
            <Row
              key={`${i.hash}-${i.index}`}
              item={i}
              name={i.propertyId !== undefined ? names.get(i.propertyId) : undefined}
            />
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-lg font-extrabold">{t("Panduan")}</h2>
        <Guide title={t("Cara mengecek dompet dan transaksimu")}>
          <p>{t("1. Salin alamat dompetmu di atas.")}</p>
          <p>
            {t("2. Buka")}{" "}
            <a
              className="font-semibold text-brand underline"
              href={me.address ? addressUrl(me.address) : EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
            >
              {t("explorer Robinhood Chain")}
            </a>{" "}
            {t("dan tempel alamat itu di kolom pencarian.")}
          </p>
          <p>
            {t(
              "3. Tab Transactions menampilkan semua transaksi; Token transfers menampilkan unit properti dan saldo Rupiah uji yang masuk atau keluar.",
            )}
          </p>
          <p>
            {t("Tentang jaringannya:")}{" "}
            <a
              className="font-semibold text-brand underline"
              href="https://docs.robinhood.com/chain"
              target="_blank"
              rel="noreferrer"
            >
              {t("dokumentasi Robinhood Chain")}
            </a>
            .
          </p>
        </Guide>
        <Guide title={t("Cara mengambil sewa")}>
          <p>
            {t(
              "Buka Portofolio, buka kartu properti yang kamu miliki, lalu tekan Ambil sewa. Sewa masuk ke saldo Rupiah-mu dan tercatat di riwayat dengan link bukti.",
            )}
          </p>
          <Link href="/portfolio" className="font-semibold text-brand underline">
            {t("Buka Portofolio")}
          </Link>
        </Guide>
        <Guide title={t("Cara menjual unit")}>
          <p>
            {t(
              "Di kartu properti pada Portofolio, isi jumlah unit dan harga di bagian Jual unit. Penawaranmu muncul di pasar sekunder, dan unit tetap menghasilkan sewa sampai ada yang membeli.",
            )}
          </p>
        </Guide>
        <Guide title={t("Cara menarik saldo ke Rupiah (versi produksi)")}>
          <p>
            {t(
              "Di demo, saldo adalah Rupiah uji dan tidak bisa ditarik. Di versi produksi, isi saldo dan penarikan berjalan lewat penyedia jasa pembayaran berlisensi Bank Indonesia (misalnya QRIS atau virtual account) ke rekening banknya atas namamu.",
            )}
          </p>
          <p>
            {t("Referensi:")}{" "}
            <a
              className="font-semibold text-brand underline"
              href="https://www.bi.go.id"
              target="_blank"
              rel="noreferrer"
            >
              Bank Indonesia
            </a>
            {" · "}
            <a
              className="font-semibold text-brand underline"
              href="https://www.ojk.go.id"
              target="_blank"
              rel="noreferrer"
            >
              OJK
            </a>
          </p>
        </Guide>
        <Guide title={t("Keamanan dompet")}>
          <p>
            {t(
              "Dompetmu dibuat dan dilindungi oleh Privy. URSSET tidak menyimpan kuncinya. Kamu bisa mengekspornya kapan saja dari bagian Dompet kamu untuk dipakai di aplikasi dompet lain.",
            )}
          </p>
          <a
            className="font-semibold text-brand underline"
            href="https://docs.privy.io"
            target="_blank"
            rel="noreferrer"
          >
            {t("Dokumentasi Privy")}
          </a>
        </Guide>
      </section>
    </div>
  );
}
