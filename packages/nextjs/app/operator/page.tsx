"use client";

import { useState } from "react";
import { txUrl } from "~~/lib/chain";
import { friendlyError, num, rp } from "~~/lib/format";
import { useSaleInfo } from "~~/lib/hooks";

/** Stand-in for the property owner: deposits this month's rent so it is split onchain. */
export default function Operator() {
  const info = useSaleInfo();
  const [passcode, setPasscode] = useState("");
  const [perUnit, setPerUnit] = useState(100);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; hash?: string } | null>(null);

  const circulating = Number(info.circulating ?? 0n);
  const amount = circulating * perUnit;

  async function deposit() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/rent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode, amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal");
      setResult({ ok: true, text: `Sewa ${rp(amount)} dibagikan.`, hash: json.hash });
      void info.refetch();
    } catch (e) {
      setResult({ ok: false, text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <span className="chip">Pemilik kos (demo)</span>
        <h1 className="mt-2 text-2xl font-black">Setor sewa bulan ini</h1>
        <p className="text-sm text-muted">
          Sewa dibagi ke semua unit yang sudah terjual. Unit yang belum terjual tidak menerima sewa.
        </p>
        <dl className="mt-3 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Unit beredar</dt>
            <dd className="font-semibold">{num(circulating)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Sudah dibagikan sejauh ini</dt>
            <dd className="font-semibold">{rp(info.rentPaid)}</dd>
          </div>
        </dl>
        <label className="mt-3 block text-xs font-semibold text-muted">
          Sewa per unit (Rp)
          <input
            type="number"
            min={1}
            value={perUnit}
            onChange={e => setPerUnit(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="mt-2 block text-xs font-semibold text-muted">
          Kode operator
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          className="btn-main mt-4"
          disabled={busy || circulating === 0 || perUnit < 1 || !passcode}
          onClick={deposit}
        >
          {busy ? "Memproses…" : `Setor ${rp(amount)}`}
        </button>
        {result && (
          <p
            className={`mt-3 rounded-lg p-2 text-sm ${result.ok ? "bg-brand-soft text-brand-dark" : "bg-red-50 text-red-700"}`}
          >
            {result.text}{" "}
            {result.hash && (
              <a className="font-semibold underline" href={txUrl(result.hash)} target="_blank" rel="noreferrer">
                bukti
              </a>
            )}
          </p>
        )}
      </section>
    </div>
  );
}
