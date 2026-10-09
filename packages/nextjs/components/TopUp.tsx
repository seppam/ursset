"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { friendlyError, rp } from "~~/lib/format";
import { useMe, usePost } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";

const AMOUNTS = [100_000, 500_000, 1_000_000];

/** Top up test Rupiah (simulated QRIS). The first top-up also runs the light identity check. */
export function TopUp({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const me = useMe();
  const post = usePost();
  const [amount, setAmount] = useState(500_000);
  const [fullName, setFullName] = useState("");
  const [agree, setAgree] = useState(false);
  const [phase, setPhase] = useState<"form" | "qris" | "working" | "done">("form");
  const [error, setError] = useState("");

  async function pay() {
    if (!me.address) return;
    setError("");
    setPhase("qris");
    try {
      await new Promise(r => setTimeout(r, 2200));
      setPhase("working");
      if (!me.verified) await post("/api/kyc", { address: me.address });
      await post("/api/topup", { address: me.address, amount });
      me.refetch();
      setPhase("done");
      onDone?.();
    } catch (e) {
      setError(t(friendlyError(e)));
      setPhase("form");
    }
  }

  if (phase === "qris" || phase === "working") {
    return (
      <div className="text-center">
        {phase === "qris" ? (
          <>
            <div className="mx-auto w-fit rounded-xl border border-line bg-white p-3">
              <QRCodeSVG value={`URSSET-DEMO-QRIS-${amount}`} size={150} />
            </div>
            <p className="mt-3 font-bold">{t("Menunggu pembayaran (simulasi)…")}</p>
          </>
        ) : (
          <p className="py-10 font-bold">{t("Memverifikasi dan mengisi saldo…")}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {phase === "done" && (
        <p className="mb-3 rounded-lg bg-brand-soft p-2 text-sm font-semibold text-brand-dark">
          {t("Saldo bertambah. Siap urunan.")}
        </p>
      )}
      <p className="text-sm text-muted">
        {t("Pembayaran QRIS disimulasikan. Saldo di demo adalah Rupiah uji (tIDR).")}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {AMOUNTS.map(v => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`min-h-[44px] rounded-xl border px-2 py-3 text-sm font-bold ${amount === v ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-white"}`}
          >
            {rp(v)}
          </button>
        ))}
      </div>
      {!me.verified && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-bold">{t("Verifikasi cepat")}</p>
          <p className="text-xs text-muted">
            {t("Wajib sebelum membeli. Demo: data ini tidak disimpan dan tidak masuk blockchain.")}
          </p>
          <input
            className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            placeholder={t("Nama sesuai KTP")}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
          <label className="mt-2 flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" className="mt-0.5" checked={agree} onChange={e => setAgree(e.target.checked)} />
            {t("Saya paham ini demo di jaringan uji dan bukan penawaran investasi.")}
          </label>
        </div>
      )}
      <button
        className="btn-main mt-4"
        disabled={!me.address || (!me.verified && (!agree || fullName.trim().length < 2))}
        onClick={pay}
      >
        {t("Bayar {amount} lewat QRIS", { amount: rp(amount) })}
      </button>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
