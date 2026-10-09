"use client";

import Link from "next/link";
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

function CardBody() {
  const t = useT();
  const { info, meta } = useProp();
  const sale = useSaleInfo();
  const sold =
    sale.totalUnits !== undefined && sale.unitsLeft !== undefined ? Number(sale.totalUnits - sale.unitsLeft) : 0;
  const total = Number(sale.totalUnits ?? 0n);
  return (
    <Link href={`/p/${info.id}`} className="card block overflow-hidden transition hover:shadow-md">
      <PropertyHero />
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="font-extrabold">{meta?.rooms ?? "–"}</p>
            <p className="text-xs text-muted">{t("kamar")}</p>
          </div>
          <div>
            <p className="font-extrabold">{meta ? `${meta.occupancy}%` : "–"}</p>
            <p className="text-xs text-muted">{t("terisi")}</p>
          </div>
          <div>
            <p className="font-extrabold">{rp(sale.unitPrice ?? 10_000n)}</p>
            <p className="text-xs text-muted">{t("per unit")}</p>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={sold} max={total} />
        </div>
        <span className="btn-main mt-3">{t("Mulai urunan")}</span>
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
