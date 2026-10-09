"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { isAddress } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { txUrl } from "~~/lib/chain";
import { distributor, isDeployed, market, token } from "~~/lib/contracts";
import { friendlyError, num, rp, short } from "~~/lib/format";
import { useMe, useSaleInfo, useSend } from "~~/lib/hooks";
import { property } from "~~/lib/property";

type Notice = { tone: "ok" | "bad"; text: string; hash?: string };

export default function Portfolio() {
  const { authenticated, login } = usePrivy();
  const me = useMe();
  const info = useSaleInfo();
  const send = useSend();
  const price = info.unitPrice ?? BigInt(property.unitPrice);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState("");
  const [sellUnits, setSellUnits] = useState(1);
  const [sellPrice, setSellPrice] = useState(property.unitPrice);
  const [to, setTo] = useState("");
  const [sendUnits, setSendUnits] = useState(1);

  const { data: count } = useReadContract({
    ...market,
    functionName: "listingCount",
    query: { enabled: isDeployed, refetchInterval: 5000 },
  });
  const ids = Array.from({ length: Math.min(Number(count ?? 0n), 20) }, (_, i) => BigInt(i + 1));
  const { data: listings, refetch: refetchListings } = useReadContracts({
    allowFailure: false,
    contracts: ids.map(id => ({ ...market, functionName: "listings", args: [id] }) as const),
    query: { enabled: isDeployed && ids.length > 0, refetchInterval: 5000 },
  });
  const active = (listings ?? [])
    .map((l, i) => ({ id: ids[i], seller: l[0], units: l[1], unitPrice: l[2], active: l[3] }))
    .filter(l => l.active);

  async function run(key: string, ok: string, fn: () => Promise<{ hash: string } | void>) {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fn();
      setNotice({ tone: "ok", text: ok, hash: res?.hash });
      me.refetch();
      void refetchListings();
    } catch (e) {
      setNotice({ tone: "bad", text: friendlyError(e) });
    } finally {
      setBusy("");
    }
  }

  if (!authenticated) {
    return (
      <div className="card mt-4 p-6 text-center">
        <h1 className="text-xl font-extrabold">Portofoliomu</h1>
        <p className="mt-1 text-sm text-muted">Masuk untuk melihat unit dan sewa yang masuk.</p>
        <button className="btn-main mt-4" onClick={login}>
          Masuk
        </button>
      </div>
    );
  }

  const value = me.units * price;

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <p className="text-sm text-muted">Nilai unit (harga awal)</p>
        <p className="text-3xl font-black">{rp(value)}</p>
        <p className="mt-1 text-sm text-muted">
          {num(me.units)} unit {property.name} · saldo {rp(me.idr)}
        </p>
        {!me.verified && <p className="chip mt-2">Belum terverifikasi</p>}
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">Sewa yang masuk</h2>
        <p className="text-2xl font-black text-brand-dark">{rp(me.pendingRent)}</p>
        <p className="text-xs text-muted">Dibagi proporsional dari setoran sewa yang tercatat onchain.</p>
        <button
          className="btn-main mt-3"
          disabled={me.pendingRent === 0n || busy === "claim"}
          onClick={() => run("claim", "Sewa masuk ke saldomu.", () => send({ ...distributor, functionName: "claim" }))}
        >
          {busy === "claim" ? "Memproses…" : "Ambil sewa"}
        </button>
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">Jual unit</h2>
        <p className="text-sm text-muted">Pasang harga, investor terverifikasi lain bisa membeli kapan saja.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-muted">
            Jumlah unit
            <input
              type="number"
              min={1}
              max={Number(me.units)}
              value={sellUnits}
              onChange={e => setSellUnits(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            Harga per unit (Rp)
            <input
              type="number"
              min={1}
              value={sellPrice}
              onChange={e => setSellPrice(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>
        <button
          className="btn-main mt-3"
          disabled={busy === "sell" || sellUnits < 1 || BigInt(sellUnits) > me.units}
          onClick={() =>
            run("sell", "Penawaran dipasang.", async () => {
              await send({ ...token, functionName: "approve", args: [market.address, BigInt(sellUnits)] });
              return send({ ...market, functionName: "list", args: [BigInt(sellUnits), BigInt(sellPrice)] });
            })
          }
        >
          {busy === "sell" ? "Memproses…" : `Jual ${sellUnits} unit di ${rp(sellPrice)}`}
        </button>
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">Pasar sekunder</h2>
        {active.length === 0 && <p className="mt-1 text-sm text-muted">Belum ada penawaran aktif.</p>}
        <ul className="mt-2 divide-y divide-line">
          {active.map(l => {
            const mine = l.seller.toLowerCase() === me.address?.toLowerCase();
            return (
              <li key={String(l.id)} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <b>{num(l.units)} unit</b> @ {rp(l.unitPrice)}
                  <br />
                  <span className="text-xs text-muted">
                    dari {mine ? "kamu" : short(l.seller)} · total {rp(l.units * l.unitPrice)}
                  </span>
                </span>
                {mine ? (
                  <button
                    className="btn-ghost"
                    disabled={busy === `c${l.id}`}
                    onClick={() =>
                      run(`c${l.id}`, "Penawaran dibatalkan.", () =>
                        send({ ...market, functionName: "cancel", args: [l.id] }),
                      )
                    }
                  >
                    Batal
                  </button>
                ) : (
                  <button
                    className="btn-ghost"
                    disabled={busy === `b${l.id}` || me.idr < l.units * l.unitPrice}
                    onClick={() =>
                      run(`b${l.id}`, "Unit berpindah ke kamu.", () =>
                        send({ ...market, functionName: "buy", args: [l.id] }),
                      )
                    }
                  >
                    Beli
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">Kirim unit ke wallet lain</h2>
        <p className="text-sm text-muted">
          Coba kirim ke alamat yang belum terverifikasi: smart contract akan menolaknya.
        </p>
        <input
          className="mt-3 w-full rounded-lg border border-line px-3 py-2 font-mono text-xs"
          placeholder="0x… alamat tujuan"
          value={to}
          onChange={e => setTo(e.target.value.trim())}
        />
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min={1}
            value={sendUnits}
            onChange={e => setSendUnits(Number(e.target.value))}
            className="w-24 rounded-lg border border-line px-3 py-2 text-sm"
            aria-label="Jumlah unit"
          />
          <button
            className="btn-main"
            disabled={busy === "send" || !isAddress(to) || sendUnits < 1}
            onClick={() =>
              run("send", "Unit terkirim.", () =>
                send({ ...token, functionName: "transfer", args: [to, BigInt(sendUnits)] }),
              )
            }
          >
            {busy === "send" ? "Memproses…" : "Kirim"}
          </button>
        </div>
      </section>

      {notice && (
        <div
          className={`rounded-xl p-3 text-sm ${notice.tone === "ok" ? "bg-brand-soft text-brand-dark" : "bg-red-50 text-red-700"}`}
        >
          {notice.text}{" "}
          {notice.hash && (
            <a className="font-semibold underline" href={txUrl(notice.hash)} target="_blank" rel="noreferrer">
              Lihat bukti di blockchain
            </a>
          )}
        </div>
      )}
    </div>
  );
}
