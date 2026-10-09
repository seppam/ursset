"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePT } from "./usePT";
import { isAddress } from "viem";
import { IntInput } from "~~/components/IntInput";
import { txUrl } from "~~/lib/chain";
import { num, rp, short } from "~~/lib/format";

export type Section = "claim" | "sell" | "market" | "send";
export type Notice = { tone: "ok" | "bad"; text: string; hash?: string; where: Section };
export type ListingRow = { id: string; units: bigint; unitPrice: bigint; seller: string; own: boolean };

export type CardViewProps = {
  propertyId: number;
  name: string;
  city?: string;
  cover?: string;
  units: bigint;
  unitPrice: bigint;
  pending: bigint;
  balance: bigint;
  open: boolean;
  onToggle: () => void;
  busy: string;
  notice: Notice | null;
  listings: ListingRow[];
  onClaim: () => void;
  onSell: (units: number, price: number) => void;
  onCancel: (id: string) => void;
  onBuy: (id: string) => void;
  onSend: (to: string, units: number) => void;
};

const field = "mt-1 min-h-[44px] w-full rounded-lg border border-line px-3 py-2 text-sm text-ink";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-extrabold">{children}</h3>;
}

/** One property as a single expandable card: summary always visible, every action inside the body. */
export function PropertyAccordionCard(p: CardViewProps) {
  const t = usePT();
  const uid = useId();
  const bodyId = `${uid}-body`;
  const [sellUnits, setSellUnits] = useState(1);
  const [sellPrice, setSellPrice] = useState(10_000);
  const [to, setTo] = useState("");
  const [sendUnits, setSendUnits] = useState(1);
  const hasRent = p.pending > 0n;

  function notice(where: Section) {
    const n = p.notice;
    if (!n || n.where !== where) return null;
    return (
      <div
        role="status"
        className={`mt-3 rounded-xl p-3 text-sm ${n.tone === "ok" ? "bg-brand-soft text-brand-dark" : "bg-red-50 text-red-700"}`}
      >
        {n.text}{" "}
        {n.hash && (
          <a className="font-semibold underline" href={txUrl(n.hash)} target="_blank" rel="noreferrer">
            {t("Lihat bukti di blockchain")}
          </a>
        )}
      </div>
    );
  }

  const claimBtn = (
    <button
      className="btn-main"
      disabled={!hasRent || p.busy === "claim"}
      onClick={p.onClaim}
      aria-label={hasRent ? `${t("Ambil sewa")} ${rp(p.pending)}` : undefined}
    >
      {p.busy === "claim" ? t("Memproses…") : t("Ambil sewa")}
    </button>
  );

  return (
    <article
      className={`overflow-hidden rounded-[1.25rem] border border-l-[6px] bg-white transition-shadow duration-300 ${
        p.open
          ? "border-brand/40 border-l-brand shadow-[var(--shadow-raised)]"
          : "border-line border-l-brand shadow-[var(--shadow-card)]"
      }`}
      aria-label={t("Properti {name}", { name: p.name })}
    >
      <button
        type="button"
        className="flex min-h-[44px] w-full items-center gap-3 p-4 text-left"
        aria-expanded={p.open}
        aria-controls={bodyId}
        onClick={p.onToggle}
      >
        <span
          className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 via-brand to-teal-700 bg-cover bg-center"
          style={p.cover ? { backgroundImage: `url(${p.cover})` } : undefined}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-extrabold leading-tight">{p.name}</span>
          {p.city && <span className="block truncate text-xs text-muted">{p.city}</span>}
          <span className="num mt-1 block text-lg font-black leading-tight">{rp(p.units * p.unitPrice)}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span>{t("{n} unit", { n: num(p.units) })}</span>
            {hasRent && <span className="chip num">{t("Sewa {amount} siap diambil", { amount: rp(p.pending) })}</span>}
          </span>
        </span>
        <Chevron open={p.open} />
        <span className="sr-only">
          {p.open ? t("Tutup detail {name}", { name: p.name }) : t("Buka detail {name}", { name: p.name })}
        </span>
      </button>

      {/* One-tap claim while collapsed; the full claim section lives in the body. */}
      {!p.open && (hasRent || p.notice?.where === "claim") && (
        <div className="px-4 pb-4">
          {hasRent && claimBtn}
          {notice("claim")}
        </div>
      )}

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          p.open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div id={bodyId} role="region" aria-label={p.name} className="min-h-0 overflow-hidden" inert={!p.open}>
          <div className="divide-y divide-line border-t border-line px-4">
            <section className="space-y-1 py-4">
              <div className="flex items-baseline justify-between gap-2">
                <SubHeading>{t("Sewa yang masuk")}</SubHeading>
                <Link
                  href={`/p/${p.propertyId}`}
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand underline"
                >
                  {t("Lihat halaman properti")}
                </Link>
              </div>
              <p className="num text-2xl font-black text-brand-dark">{rp(p.pending)}</p>
              <p className="text-xs text-muted">{t("Dibagi proporsional dari setoran sewa yang tercatat onchain.")}</p>
              <div className="pt-2">{claimBtn}</div>
              {notice("claim")}
            </section>

            <section className="py-4">
              <SubHeading>{t("Jual unit")}</SubHeading>
              <p className="text-sm text-muted">
                {t("Pasang harga, investor terverifikasi lain bisa membeli kapan saja.")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-muted">
                  {t("Jumlah unit")}
                  <IntInput className={field} value={sellUnits} onChange={setSellUnits} />
                </label>
                <label className="text-xs font-semibold text-muted">
                  {t("Harga per unit (Rp)")}
                  <IntInput className={field} value={sellPrice} onChange={setSellPrice} />
                </label>
              </div>
              <button
                className="btn-main mt-3"
                disabled={p.busy === "sell" || sellUnits < 1 || sellPrice < 1 || BigInt(sellUnits) > p.units}
                onClick={() => p.onSell(sellUnits, sellPrice)}
              >
                {p.busy === "sell"
                  ? t("Memproses…")
                  : t("Jual {n} unit di {price}", { n: sellUnits, price: rp(sellPrice) })}
              </button>
              {notice("sell")}
            </section>

            <section className="py-4">
              <SubHeading>{t("Pasar sekunder")}</SubHeading>
              {p.listings.length === 0 && <p className="mt-1 text-sm text-muted">{t("Belum ada penawaran aktif.")}</p>}
              <ul className="mt-1 divide-y divide-line">
                {p.listings.map(l => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span>
                      <b>{num(l.units)} unit</b> @ {rp(l.unitPrice)}
                      <br />
                      <span className="text-xs text-muted">
                        {t("dari {who} · total {total}", {
                          who: l.own ? t("kamu") : short(l.seller),
                          total: rp(l.units * l.unitPrice),
                        })}
                      </span>
                    </span>
                    {l.own ? (
                      <button className="btn-ghost" disabled={p.busy === `c${l.id}`} onClick={() => p.onCancel(l.id)}>
                        {t("Batal")}
                      </button>
                    ) : (
                      <button
                        className="btn-ghost"
                        disabled={p.busy === `b${l.id}` || p.balance < l.units * l.unitPrice}
                        onClick={() => p.onBuy(l.id)}
                      >
                        {t("Beli")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {notice("market")}
            </section>

            <section className="py-2">
              <details className="group" open={p.notice?.where === "send" || undefined}>
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                  <SubHeading>{t("Kirim unit ke wallet lain")}</SubHeading>
                  <span className="transition-transform group-open:rotate-180">
                    <Chevron open={false} />
                  </span>
                </summary>
                <div className="pb-3">
                  <p className="text-sm text-muted">
                    {t("Coba kirim ke alamat yang belum terverifikasi: smart contract akan menolaknya.")}
                  </p>
                  <input
                    className="mt-3 min-h-[44px] w-full rounded-lg border border-line px-3 py-2 font-mono text-xs"
                    placeholder={t("0x… alamat tujuan")}
                    aria-label={t("0x… alamat tujuan")}
                    value={to}
                    onChange={e => setTo(e.target.value.trim())}
                  />
                  <div className="mt-2 flex gap-2">
                    <IntInput
                      className="min-h-[48px] w-24 rounded-lg border border-line px-3 py-2 text-sm"
                      value={sendUnits}
                      onChange={setSendUnits}
                      aria-label={t("Jumlah unit")}
                    />
                    <button
                      className="btn-main"
                      disabled={p.busy === "send" || !isAddress(to) || sendUnits < 1}
                      onClick={() => p.onSend(to, sendUnits)}
                    >
                      {p.busy === "send" ? t("Memproses…") : t("Kirim")}
                    </button>
                  </div>
                  {notice("send")}
                </div>
              </details>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
