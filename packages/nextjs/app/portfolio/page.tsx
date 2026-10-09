"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { isAddress } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { IntInput } from "~~/components/IntInput";
import { PropertyCard } from "~~/components/PropertyCard";
import { txUrl } from "~~/lib/chain";
import { friendlyError, num, rp, short } from "~~/lib/format";
import { abis } from "~~/lib/generated/ursset";
import { useMe, usePropMe, useSaleInfo, useSend } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { PropertyProvider, useProp, useProperties } from "~~/lib/properties";

type Section = "claim" | "sell" | "market" | "send";
type Notice = { tone: "ok" | "bad"; text: string; hash?: string; where: Section };

const sectionOf = (key: string): Section => (key === "claim" || key === "sell" || key === "send" ? key : "market");
const input = "mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink";

function PropertyPortfolio() {
  const t = useT();
  const { c, name, info } = useProp();
  const me = useMe();
  const mine = usePropMe();
  const sale = useSaleInfo();
  const send = useSend();
  const price = sale.unitPrice ?? 10_000n;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState("");
  const [sellUnits, setSellUnits] = useState(1);
  const [sellPrice, setSellPrice] = useState(10_000);
  const [to, setTo] = useState("");
  const [sendUnits, setSendUnits] = useState(1);

  const { data: count } = useReadContract({
    ...c.market,
    functionName: "listingCount",
    query: { refetchInterval: 5000 },
  });
  const ids = Array.from({ length: Math.min(Number(count ?? 0n), 20) }, (_, i) => BigInt(i + 1));
  const { data: listings, refetch: refetchListings } = useReadContracts({
    allowFailure: false,
    contracts: ids.map(id => ({ ...c.market, functionName: "listings", args: [id] }) as const),
    query: { enabled: ids.length > 0, refetchInterval: 5000 },
  });
  const active = (listings ?? [])
    .map((l, i) => ({ id: ids[i], seller: l[0], units: l[1], unitPrice: l[2], active: l[3] }))
    .filter(l => l.active);

  // Shows the result inside the card the user just acted on, so it is easy to notice.
  function renderNotice(where: Section) {
    if (!notice || notice.where !== where) return null;
    return (
      <div
        className={`mt-3 rounded-xl p-3 text-sm ${notice.tone === "ok" ? "bg-brand-soft text-brand-dark" : "bg-red-50 text-red-700"}`}
      >
        {notice.text}{" "}
        {notice.hash && (
          <a className="font-semibold underline" href={txUrl(notice.hash)} target="_blank" rel="noreferrer">
            {t("Lihat bukti di blockchain")}
          </a>
        )}
      </div>
    );
  }

  async function run(key: string, ok: string, fn: () => Promise<{ hash: string } | void>) {
    const where = sectionOf(key);
    setBusy(key);
    setNotice(null);
    try {
      const res = await fn();
      setNotice({ tone: "ok", text: t(ok), hash: res?.hash, where });
      me.refetch();
      mine.refetch();
      void refetchListings();
    } catch (e) {
      setNotice({ tone: "bad", text: t(friendlyError(e)), where });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-3">
      <section className="card p-5">
        <Link href={`/p/${info.id}`} className="text-sm font-semibold text-brand underline">
          {name}
        </Link>
        <p className="text-3xl font-black">{rp(mine.units * price)}</p>
        <p className="text-sm text-muted">
          {t("{n} unit · saldo {balance}", { n: num(mine.units), balance: rp(me.idr) })}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">{t("Sewa yang masuk")}</h2>
        <p className="text-2xl font-black text-brand-dark">{rp(mine.pendingRent)}</p>
        <p className="text-xs text-muted">{t("Dibagi proporsional dari setoran sewa yang tercatat onchain.")}</p>
        <button
          className="btn-main mt-3"
          disabled={mine.pendingRent === 0n || busy === "claim"}
          onClick={() =>
            run("claim", "Sewa masuk ke saldomu.", () => send({ ...c.distributor, functionName: "claim" }))
          }
        >
          {busy === "claim" ? t("Memproses…") : t("Ambil sewa")}
        </button>
        {renderNotice("claim")}
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">{t("Jual unit")}</h2>
        <p className="text-sm text-muted">{t("Pasang harga, investor terverifikasi lain bisa membeli kapan saja.")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-muted">
            {t("Jumlah unit")}
            <IntInput className={input} value={sellUnits} onChange={setSellUnits} />
          </label>
          <label className="text-xs font-semibold text-muted">
            {t("Harga per unit (Rp)")}
            <IntInput className={input} value={sellPrice} onChange={setSellPrice} />
          </label>
        </div>
        <button
          className="btn-main mt-3"
          disabled={busy === "sell" || sellUnits < 1 || sellPrice < 1 || BigInt(sellUnits) > mine.units}
          onClick={() =>
            run("sell", "Penawaran dipasang.", async () => {
              await send({ ...c.token, functionName: "approve", args: [c.market.address, BigInt(sellUnits)] });
              return send({ ...c.market, functionName: "list", args: [BigInt(sellUnits), BigInt(sellPrice)] });
            })
          }
        >
          {busy === "sell" ? t("Memproses…") : t("Jual {n} unit di {price}", { n: sellUnits, price: rp(sellPrice) })}
        </button>
        {renderNotice("sell")}
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">{t("Pasar sekunder")}</h2>
        {active.length === 0 && <p className="mt-1 text-sm text-muted">{t("Belum ada penawaran aktif.")}</p>}
        <ul className="mt-2 divide-y divide-line">
          {active.map(l => {
            const own = l.seller.toLowerCase() === me.address?.toLowerCase();
            return (
              <li key={String(l.id)} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <b>{num(l.units)} unit</b> @ {rp(l.unitPrice)}
                  <br />
                  <span className="text-xs text-muted">
                    {t("dari {who} · total {total}", {
                      who: own ? t("kamu") : short(l.seller),
                      total: rp(l.units * l.unitPrice),
                    })}
                  </span>
                </span>
                {own ? (
                  <button
                    className="btn-ghost"
                    disabled={busy === `c${l.id}`}
                    onClick={() =>
                      run(`c${l.id}`, "Penawaran dibatalkan.", () =>
                        send({ ...c.market, functionName: "cancel", args: [l.id] }),
                      )
                    }
                  >
                    {t("Batal")}
                  </button>
                ) : (
                  <button
                    className="btn-ghost"
                    disabled={busy === `b${l.id}` || me.idr < l.units * l.unitPrice}
                    onClick={() =>
                      run(`b${l.id}`, "Unit berpindah ke kamu.", () =>
                        send({ ...c.market, functionName: "buy", args: [l.id] }),
                      )
                    }
                  >
                    {t("Beli")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {renderNotice("market")}
      </section>

      <section className="card p-5">
        <h2 className="font-extrabold">{t("Kirim unit ke wallet lain")}</h2>
        <p className="text-sm text-muted">
          {t("Coba kirim ke alamat yang belum terverifikasi: smart contract akan menolaknya.")}
        </p>
        <input
          className="mt-3 w-full rounded-lg border border-line px-3 py-2 font-mono text-xs"
          placeholder={t("0x… alamat tujuan")}
          value={to}
          onChange={e => setTo(e.target.value.trim())}
        />
        <div className="mt-2 flex gap-2">
          <IntInput
            className="w-24 rounded-lg border border-line px-3 py-2 text-sm"
            value={sendUnits}
            onChange={setSendUnits}
            aria-label={t("Jumlah unit")}
          />
          <button
            className="btn-main"
            disabled={busy === "send" || !isAddress(to) || sendUnits < 1}
            onClick={() =>
              run("send", "Unit terkirim.", () =>
                send({ ...c.token, functionName: "transfer", args: [to, BigInt(sendUnits)] }),
              )
            }
          >
            {busy === "send" ? t("Memproses…") : t("Kirim")}
          </button>
        </div>
        {renderNotice("send")}
      </section>
    </div>
  );
}

export default function Portfolio() {
  const t = useT();
  const { authenticated, login } = usePrivy();
  const me = useMe();
  const { data: properties, isLoading } = useProperties();

  // Which properties does this investor hold units in? That decides the two sections below.
  const balances = useReadContracts({
    allowFailure: false,
    contracts: (properties ?? []).map(
      p => ({ address: p.token, abi: abis.PropertyToken, functionName: "balanceOf", args: [me.address!] }) as const,
    ),
    query: { enabled: !!me.address && !!properties?.length, refetchInterval: 5000 },
  });

  if (!authenticated) {
    return (
      <div className="card mt-4 p-6 text-center">
        <h1 className="text-xl font-extrabold">{t("Portofoliomu")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Masuk untuk melihat unit dan sewa yang masuk.")}</p>
        <button className="btn-main mt-4" onClick={login}>
          {t("Masuk")}
        </button>
      </div>
    );
  }

  const ready = !!properties && !!balances.data;
  const owned = (properties ?? []).filter((_, i) => (balances.data?.[i] ?? 0n) > 0n);
  const others = (properties ?? []).filter((_, i) => (balances.data?.[i] ?? 0n) === 0n);

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <p className="text-sm text-muted">{t("Saldo Rupiah uji")}</p>
        <p className="text-3xl font-black">{rp(me.idr)}</p>
        {!me.verified && <p className="chip mt-2">{t("Belum terverifikasi")}</p>}
      </section>

      {(isLoading || !ready) && <p className="text-center text-sm text-muted">{t("Memuat…")}</p>}

      {ready && (
        <>
          <section className="space-y-3">
            <h2 className="px-1 text-lg font-extrabold">{t("Properti kamu")}</h2>
            {owned.length === 0 && (
              <p className="card p-4 text-sm text-muted">
                {t("Kamu belum punya unit di properti mana pun. Mulai dari yang di bawah.")}
              </p>
            )}
            {owned.map(p => (
              <PropertyProvider key={p.id} info={p}>
                <PropertyPortfolio />
              </PropertyProvider>
            ))}
          </section>

          {others.length > 0 && (
            <section className="space-y-3">
              <div className="px-1">
                <h2 className="text-lg font-extrabold">{t("Properti yang sebaiknya kamu miliki sekarang")}</h2>
                <p className="text-sm text-muted">{t("Tambah unit atau mulai dari properti lain, mulai Rp10.000.")}</p>
              </div>
              {others.map(p => (
                <PropertyCard key={p.id} info={p} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
