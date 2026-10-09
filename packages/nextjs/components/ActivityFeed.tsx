"use client";

import { txUrl } from "~~/lib/chain";
import { num, rp, short } from "~~/lib/format";
import { useActivity } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { useMetaMap, useProperties } from "~~/lib/properties";

export function ActivityFeed({ limit = 6 }: { limit?: number }) {
  const t = useT();
  const { data, isLoading } = useActivity(limit);
  const { data: properties } = useProperties();
  const names = new Map(useMetaMap(properties).map(({ info, meta }) => [info.id, meta?.name ?? `#${info.id + 1}`]));

  return (
    <section className="card p-4">
      <h3 className="font-extrabold">{t("Aktivitas terbaru")}</h3>
      {isLoading && <p className="mt-2 text-sm text-muted">{t("Memuat…")}</p>}
      {data && data.length === 0 && (
        <p className="mt-2 text-sm text-muted">{t("Belum ada urunan. Jadilah yang pertama.")}</p>
      )}
      <ul className="mt-2 divide-y divide-line">
        {data?.map(a => (
          <li key={`${a.hash}-${a.kind}`} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>
              {a.kind === "buy" ? (
                <>
                  <b>{short(a.who)}</b> {t("urunan {n} unit", { n: num(a.units) })}
                  {a.roomId ? ` ${t("di room #{id}", { id: String(a.roomId) })}` : ""}
                  <br />
                  <span className="text-xs text-muted">{names.get(a.propertyId)}</span>
                </>
              ) : (
                <>
                  {t("Sewa {amount} dibagikan ke pemegang unit", { amount: rp(a.amount) })}
                  <br />
                  <span className="text-xs text-muted">{names.get(a.propertyId)}</span>
                </>
              )}
            </span>
            <a
              className="shrink-0 text-xs font-semibold text-brand underline"
              href={txUrl(a.hash)}
              target="_blank"
              rel="noreferrer"
            >
              {t("bukti")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
