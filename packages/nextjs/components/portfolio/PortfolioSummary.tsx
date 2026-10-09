"use client";

import { usePT } from "./usePT";
import { num, rp } from "~~/lib/format";

/** Totals across every property the investor holds. */
export function PortfolioSummary({
  totalValue,
  totalPending,
  count,
}: {
  totalValue: bigint;
  totalPending: bigint;
  count: number;
}) {
  const t = usePT();
  return (
    <section
      aria-label={t("Ringkasan portofolio")}
      className="card grid grid-cols-[1.5fr_1.2fr_0.8fr] divide-x divide-line p-4"
    >
      <div className="min-w-0 pr-3">
        <p className="eyebrow">{t("Total nilai")}</p>
        <p className="num text-base font-black sm:text-xl">{rp(totalValue)}</p>
      </div>
      <div className="min-w-0 px-3">
        <p className="eyebrow">{t("Sewa menunggu")}</p>
        <p className={`num text-base font-black sm:text-xl ${totalPending > 0n ? "text-brand-dark" : ""}`}>
          {rp(totalPending)}
        </p>
      </div>
      <div className="min-w-0 pl-3">
        <p className="eyebrow">{t("Properti")}</p>
        <p className="num text-lg font-black sm:text-xl">{num(count)}</p>
      </div>
    </section>
  );
}
