"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { QRCodeSVG } from "qrcode.react";
import { txUrl } from "~~/lib/chain";
import { friendlyError, num, rp } from "~~/lib/format";
import { useMe, usePost, usePropMe, useSaleInfo, useSend } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { useProp } from "~~/lib/properties";

const STEPS = ["Masuk", "Isi saldo", "Urunan"];
const TOPUPS = [100_000, 500_000, 1_000_000];

function Stepper({ step }: { step: number }) {
  const t = useT();
  return (
    <ol className="mb-4 flex items-center gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-brand text-white" : active ? "bg-ink text-white" : "bg-slate-100 text-muted"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`text-xs font-semibold ${active ? "text-ink" : "text-muted"}`}>
              {t(label === "Urunan" ? "Urunan" : label)}
            </span>
            {n < 3 && <span className="h-px flex-1 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}

/** The whole purchase in three steps: sign in, top up (with a light identity check), chip in. */
export function ThreeSteps({ roomId = 0n }: { roomId?: bigint }) {
  const t = useT();
  const { ready, authenticated, login } = usePrivy();
  const { c, name } = useProp();
  const me = useMe();
  const propMe = usePropMe();
  const info = useSaleInfo();
  const send = useSend();
  const post = usePost();

  const price = info.unitPrice ?? 10_000n;
  const step = !authenticated ? 1 : !me.verified || me.idr < price ? 2 : 3;

  // Step 1 follow-up: the server tops up a little gas so the user never sees a fee.
  const dripped = useRef<string>("");
  useEffect(() => {
    if (authenticated && me.address && dripped.current !== me.address) {
      dripped.current = me.address;
      post("/api/onboard", { address: me.address }).catch(() => (dripped.current = ""));
    }
  }, [authenticated, me.address, post]);

  // Step 2 state
  const [topup, setTopup] = useState(500_000);
  const [fullName, setFullName] = useState("");
  const [agree, setAgree] = useState(false);
  const [phase, setPhase] = useState<"form" | "qris" | "working">("form");

  // Step 3 state
  const [units, setUnits] = useState(5);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ hash: string; units: number } | null>(null);
  const [error, setError] = useState("");

  const maxUnits = Math.max(1, Math.min(Number(me.idr / price), Number(info.unitsLeft ?? 0n) || 1));
  const chosen = Math.min(units, maxUnits);
  const total = BigInt(chosen) * price;

  async function pay() {
    if (!me.address) return;
    setError("");
    setPhase("qris");
    try {
      await new Promise(r => setTimeout(r, 2200));
      setPhase("working");
      if (!me.verified) await post("/api/kyc", { address: me.address });
      await post("/api/topup", { address: me.address, amount: topup });
      me.refetch();
    } catch (e) {
      setError(t(friendlyError(e)));
    } finally {
      setPhase("form");
    }
  }

  async function buy() {
    setError("");
    setBusy(true);
    try {
      const { hash } = await send({ ...c.sale, functionName: "buy", args: [BigInt(chosen), roomId] });
      setDone({ hash, units: chosen });
      me.refetch();
      propMe.refetch();
      info.refetch();
    } catch (e) {
      setError(t(friendlyError(e)));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-2xl">
          🎉
        </div>
        <h3 className="text-xl font-extrabold">{t("Kamu punya {n} unit!", { n: num(done.units) })}</h3>
        <p className="mt-1 text-sm text-muted">
          {t("Bagian {name} senilai {amount} sekarang atas namamu.", { name, amount: rp(BigInt(done.units) * price) })}
        </p>
        <a
          className="mt-3 inline-block text-xs font-semibold text-brand underline"
          href={txUrl(done.hash)}
          target="_blank"
          rel="noreferrer"
        >
          {t("Lihat bukti di blockchain")}
        </a>
        <div className="mt-4 grid gap-2">
          <Link href="/portfolio" className="btn-main">
            {t("Lihat portofolio")}
          </Link>
          <button className="btn-ghost justify-center" onClick={() => setDone(null)}>
            {t("Urunan lagi")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <Stepper step={step} />

      {step === 1 && (
        <div>
          <h3 className="text-lg font-extrabold">{t("Masuk dengan email atau Google")}</h3>
          <p className="mt-1 text-sm text-muted">
            {t("Tanpa aplikasi tambahan dan tanpa kata sandi baru. Sekitar 10 detik.")}
          </p>
          <button className="btn-main mt-4" disabled={!ready} onClick={login}>
            {t("Masuk untuk mulai")}
          </button>
        </div>
      )}

      {step === 2 && phase === "form" && (
        <div>
          <h3 className="text-lg font-extrabold">{t("Isi saldo Rupiah")}</h3>
          <p className="mt-1 text-sm text-muted">
            {t("Pembayaran QRIS disimulasikan. Saldo di demo adalah Rupiah uji (tIDR).")}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TOPUPS.map(v => (
              <button
                key={v}
                onClick={() => setTopup(v)}
                className={`rounded-xl border px-2 py-3 text-sm font-bold ${topup === v ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-white"}`}
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
            {t("Bayar {amount} lewat QRIS", { amount: rp(topup) })}
          </button>
        </div>
      )}

      {step === 2 && phase !== "form" && (
        <div className="text-center">
          {phase === "qris" ? (
            <>
              <div className="mx-auto w-fit rounded-xl border border-line bg-white p-3">
                <QRCodeSVG value={`URSSET-DEMO-QRIS-${topup}`} size={150} />
              </div>
              <p className="mt-3 font-bold">{t("Menunggu pembayaran (simulasi)…")}</p>
            </>
          ) : (
            <p className="py-10 font-bold">{t("Memverifikasi dan mengisi saldo…")}</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="text-lg font-extrabold">{t("Pilih nominal urunan")}</h3>
          <p className="text-sm text-muted">
            {t("1 unit = {price}. Saldo kamu {balance}.", { price: rp(price), balance: rp(me.idr) })}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[1, 5, 10].map(u => (
              <button
                key={u}
                disabled={u > maxUnits}
                onClick={() => setUnits(u)}
                className={`rounded-xl border px-2 py-3 text-sm font-bold disabled:opacity-40 ${chosen === u ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-white"}`}
              >
                {rp(BigInt(u) * price)}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={1}
            max={maxUnits}
            value={chosen}
            onChange={e => setUnits(Number(e.target.value))}
            className="mt-4 w-full"
            aria-label={t("Jumlah unit")}
          />
          <dl className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t("Jumlah unit")}</dt>
              <dd className="font-semibold">{num(chosen)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t("Harga per unit")}</dt>
              <dd className="font-semibold">{rp(price)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t("Biaya untuk kamu")}</dt>
              <dd className="font-semibold">Rp0</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-1">
              <dt className="font-bold">{t("Total")}</dt>
              <dd className="font-extrabold">{rp(total)}</dd>
            </div>
          </dl>
          <button className="btn-main mt-4" disabled={busy || me.idr < total} onClick={buy}>
            {busy ? t("Memproses…") : t("Urunan {amount}", { amount: rp(total) })}
          </button>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
