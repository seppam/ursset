"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContracts } from "wagmi";
import { ChartIcon, CoinIcon, SwapIcon } from "~~/components/Icons";
import { PropertyCard, PropertyCardSkeleton } from "~~/components/PropertyCard";
import { ConnectedPropertyCard } from "~~/components/portfolio/ConnectedPropertyCard";
import { PortfolioSummary } from "~~/components/portfolio/PortfolioSummary";
import { contractsFor } from "~~/lib/contracts";
import { rp } from "~~/lib/format";
import { useMe } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { PropertyProvider, useProperties } from "~~/lib/properties";

export default function Portfolio() {
  const t = useT();
  const { authenticated, login } = usePrivy();
  const me = useMe();
  const { data: properties, isLoading } = useProperties();

  // One batched read for every property: units held, rent waiting and unit price.
  // It decides which section a property is in, the top summary and which card starts open.
  const stats = useReadContracts({
    allowFailure: false,
    contracts: (properties ?? []).flatMap(p => {
      const c = contractsFor(p);
      return [
        { ...c.token, functionName: "balanceOf", args: [me.address!] },
        { ...c.distributor, functionName: "pending", args: [me.address!] },
        { ...c.sale, functionName: "unitPrice" },
      ] as const;
    }),
    query: { enabled: !!me.address && !!properties?.length, refetchInterval: 5000 },
  });
  const [toggled, setToggled] = useState<Record<number, boolean>>({});

  if (!authenticated) {
    return (
      <div className="card mx-auto mt-4 max-w-md p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
          <ChartIcon size={28} />
        </div>
        <h1 className="text-xl font-extrabold">{t("Portofoliomu")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Masuk untuk melihat unit dan sewa yang masuk.")}</p>
        <button className="btn-main mt-4" onClick={login}>
          {t("Masuk")}
        </button>
      </div>
    );
  }

  const ready = !!properties && !!stats.data;
  const rows = (properties ?? []).map((info, i) => {
    const units = (stats.data?.[i * 3] as bigint | undefined) ?? 0n;
    const pending = (stats.data?.[i * 3 + 1] as bigint | undefined) ?? 0n;
    const price = (stats.data?.[i * 3 + 2] as bigint | undefined) ?? 10_000n;
    return { info, units, pending, value: units * price };
  });
  const owned = rows.filter(r => r.units > 0n);
  const others = rows.filter(r => r.units === 0n).map(r => r.info);
  const totalValue = owned.reduce((sum, r) => sum + r.value, 0n);
  const totalPending = owned.reduce((sum, r) => sum + r.pending, 0n);
  // Start with one card open: the only one, else the first with rent waiting, else the first.
  const defaultId = (owned.find(r => r.pending > 0n) ?? owned[0])?.info.id;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] bg-gradient-to-br from-brand to-brand-deep p-5 text-white shadow-[var(--shadow-raised)]">
        <p className="text-sm text-white/80">{t("Saldo Rupiah uji")}</p>
        <p className="num text-4xl font-black">{rp(me.idr)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="chip bg-white/15 text-white">{t("Data uji")}</span>
          {!me.verified && <span className="chip bg-amber-100 text-amber-900">{t("Belum terverifikasi")}</span>}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          {[
            { href: "/", label: "Urunan", Icon: CoinIcon },
            { href: "#properti-kamu", label: "Ambil sewa", Icon: ChartIcon },
            { href: "#properti-kamu", label: "Jual unit", Icon: SwapIcon },
          ].map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-white/15 hover:bg-white/25"
            >
              <Icon size={20} />
              {t(label)}
            </Link>
          ))}
        </div>
      </section>

      {(isLoading || !ready) && (
        <div className="grid gap-4 md:grid-cols-2" aria-busy>
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      )}

      {ready && (
        <>
          {owned.length > 0 && (
            <PortfolioSummary totalValue={totalValue} totalPending={totalPending} count={owned.length} />
          )}

          <section id="properti-kamu" className="scroll-mt-20 space-y-3">
            <h2 className="px-1 text-lg font-extrabold">{t("Properti kamu")}</h2>
            {owned.length === 0 && (
              <div className="card p-5 text-center">
                <p className="font-extrabold">{t("Belum ada unit")}</p>
                <p className="mt-1 text-sm text-muted">
                  {t("Kamu belum punya unit di properti mana pun. Mulai dari yang di bawah.")}
                </p>
              </div>
            )}
            <div className="mx-auto max-w-3xl space-y-5">
              {owned.map(({ info }) => (
                <PropertyProvider key={info.id} info={info}>
                  <ConnectedPropertyCard
                    open={toggled[info.id] ?? info.id === defaultId}
                    onToggle={() =>
                      setToggled(prev => ({ ...prev, [info.id]: !(prev[info.id] ?? info.id === defaultId) }))
                    }
                  />
                </PropertyProvider>
              ))}
            </div>
          </section>

          {others.length > 0 && (
            <section className="space-y-3">
              <div className="px-1">
                <h2 className="text-lg font-extrabold">{t("Properti yang sebaiknya kamu miliki sekarang")}</h2>
                <p className="text-sm text-muted">{t("Tambah unit atau mulai dari properti lain, mulai Rp10.000.")}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {others.map(p => (
                  <PropertyCard key={p.id} info={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
