"use client";

import { useState } from "react";
import { type Notice, PropertyAccordionCard, type Section } from "./PropertyAccordionCard";
import { usePT } from "./usePT";
import { useReadContract, useReadContracts } from "wagmi";
import { friendlyError } from "~~/lib/format";
import { useMe, usePropMe, useSaleInfo, useSend } from "~~/lib/hooks";
import { useProp } from "~~/lib/properties";

const sectionOf = (key: string): Section => (key === "claim" || key === "sell" || key === "send" ? key : "market");

/** Wires one property's contracts to the card. Must sit inside a PropertyProvider. */
export function ConnectedPropertyCard({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const t = usePT();
  const { c, info, meta, name } = useProp();
  const me = useMe();
  const mine = usePropMe();
  const sale = useSaleInfo();
  const send = useSend();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState("");

  // The market is only polled while the card is open.
  const { data: count } = useReadContract({
    ...c.market,
    functionName: "listingCount",
    query: { enabled: open, refetchInterval: 5000 },
  });
  const ids = Array.from({ length: Math.min(Number(count ?? 0n), 20) }, (_, i) => BigInt(i + 1));
  const { data: rows, refetch: refetchListings } = useReadContracts({
    allowFailure: false,
    contracts: ids.map(id => ({ ...c.market, functionName: "listings", args: [id] }) as const),
    query: { enabled: open && ids.length > 0, refetchInterval: 5000 },
  });
  const listings = (rows ?? [])
    .map((l, i) => ({
      id: String(ids[i]),
      seller: l[0] as string,
      units: l[1],
      unitPrice: l[2],
      active: l[3],
      own: l[0].toLowerCase() === me.address?.toLowerCase(),
    }))
    .filter(l => l.active);

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
    <PropertyAccordionCard
      propertyId={info.id}
      name={name}
      city={meta?.city}
      cover={meta?.images[0]}
      units={mine.units}
      unitPrice={sale.unitPrice ?? 10_000n}
      pending={mine.pendingRent}
      balance={me.idr}
      open={open}
      onToggle={onToggle}
      busy={busy}
      notice={notice}
      listings={listings}
      onClaim={() => run("claim", "Sewa masuk ke saldomu.", () => send({ ...c.distributor, functionName: "claim" }))}
      onSell={(units, price) =>
        run("sell", "Penawaran dipasang.", async () => {
          await send({ ...c.token, functionName: "approve", args: [c.market.address, BigInt(units)] });
          return send({ ...c.market, functionName: "list", args: [BigInt(units), BigInt(price)] });
        })
      }
      onCancel={id =>
        run(`c${id}`, "Penawaran dibatalkan.", () => send({ ...c.market, functionName: "cancel", args: [BigInt(id)] }))
      }
      onBuy={id =>
        run(`b${id}`, "Unit berpindah ke kamu.", () => send({ ...c.market, functionName: "buy", args: [BigInt(id)] }))
      }
      onSend={(to, units) =>
        run("send", "Unit terkirim.", () =>
          send({ ...c.token, functionName: "transfer", args: [to as `0x${string}`, BigInt(units)] }),
        )
      }
    />
  );
}
