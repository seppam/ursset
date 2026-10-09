"use client";

import Link from "next/link";
import { Progress } from "~~/components/Progress";
import { rp } from "~~/lib/format";
import { useSaleInfo } from "~~/lib/hooks";
import { property } from "~~/lib/property";

export function PropertyHero() {
  return (
    <div className="flex h-36 items-end rounded-t-[1.25rem] bg-gradient-to-br from-emerald-500 via-brand to-teal-700 p-4 text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Rumah kos · ilustrasi demo</p>
        <h2 className="text-2xl font-black">{property.name}</h2>
        <p className="text-sm opacity-90">{property.city}</p>
      </div>
    </div>
  );
}

export function PropertyCard() {
  const info = useSaleInfo();
  const sold =
    info.totalUnits !== undefined && info.unitsLeft !== undefined ? Number(info.totalUnits - info.unitsLeft) : 0;

  return (
    <Link href="/p/melati" className="card block overflow-hidden transition hover:shadow-md">
      <PropertyHero />
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="font-extrabold">{property.rooms}</p>
            <p className="text-xs text-muted">kamar</p>
          </div>
          <div>
            <p className="font-extrabold">{property.occupancy}%</p>
            <p className="text-xs text-muted">terisi</p>
          </div>
          <div>
            <p className="font-extrabold">{rp(property.unitPrice)}</p>
            <p className="text-xs text-muted">per unit</p>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={sold} max={property.totalUnits} />
        </div>
        <span className="btn-main mt-3">Mulai urunan</span>
      </div>
    </Link>
  );
}
