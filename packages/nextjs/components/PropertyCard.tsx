"use client";

import Link from "next/link";
import { ShieldIcon } from "~~/components/Icons";
import { Progress } from "~~/components/Progress";
import { rp } from "~~/lib/format";
import { useSaleInfo } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { type PropertyInfo, PropertyProvider, useProp } from "~~/lib/properties";

/** Cover photo with name and city on top. Falls back to a gradient while the photo loads. */
export function PropertyHero({ rounded = true }: { rounded?: boolean }) {
  const t = useT();
  const { meta, name } = useProp();
  const cover = meta?.images[0];
  return (
    <div
      className={`relative flex h-40 items-end bg-gradient-to-br from-emerald-500 via-brand to-teal-700 p-4 text-white ${rounded ? "rounded-t-[1.25rem]" : ""}`}
      style={
        cover ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined
      }
    >
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{t("Rumah kos · ilustrasi demo")}</p>
        <h2 className="text-2xl font-black drop-shadow">{name}</h2>
        <p className="text-sm opacity-95">{meta?.city}</p>
      </div>
    </div>
  );
}

/** Small trust chips shared by cards and the detail page. */
export function TrustChips() {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="chip">
        <ShieldIcon size={14} />
        {t("Terverifikasi onchain")}
      </span>
      <span className="chip chip-neutral">{t("Data uji")}</span>
    </div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="skeleton h-40 rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-12 w-full rounded-full" />
      </div>
    </div>
  );
}

function CardBody() {
  const t = useT();
  const { info, meta } = useProp();
  const sale = useSaleInfo();
  const sold =
    sale.totalUnits !== undefined && sale.unitsLeft !== undefined ? Number(sale.totalUnits - sale.unitsLeft) : 0;
  const total = Number(sale.totalUnits ?? 0n);
  return (
    <Link href={`/p/${info.id}`} className="card flex h-full flex-col overflow-hidden transition hover:shadow-md">
      <PropertyHero />
      <div className="flex flex-1 flex-col p-4">
        <TrustChips />
        <p className="mt-3 text-sm text-muted">{t("Mulai dari")}</p>
        <p className="num text-2xl font-black leading-tight">
          {rp(sale.unitPrice ?? 10_000n)} <span className="text-sm font-semibold text-muted">/ {t("unit")}</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-xl bg-slate-50 px-3 py-2">
            <b>{meta?.rooms ?? "–"}</b> <span className="text-muted">{t("kamar")}</span>
          </p>
          <p className="rounded-xl bg-slate-50 px-3 py-2">
            <b>{meta ? `${meta.occupancy}%` : "–"}</b> <span className="text-muted">{t("terisi")}</span>
          </p>
        </div>
        <div className="mt-3 flex-1">
          <Progress value={sold} max={total} />
        </div>
        <span className="btn-main mt-4">{t("Mulai urunan")}</span>
      </div>
    </Link>
  );
}

export function PropertyCard({ info }: { info: PropertyInfo }) {
  return (
    <PropertyProvider info={info}>
      <CardBody />
    </PropertyProvider>
  );
}
