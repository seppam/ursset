"use client";

import { txUrl } from "~~/lib/chain";
import { num, rp, short } from "~~/lib/format";
import { useActivity } from "~~/lib/hooks";

export function ActivityFeed({ limit = 6 }: { limit?: number }) {
  const { data, isLoading } = useActivity(limit);

  return (
    <section className="card p-4">
      <h3 className="font-extrabold">Aktivitas terbaru</h3>
      {isLoading && <p className="mt-2 text-sm text-muted">Memuat…</p>}
      {data && data.length === 0 && <p className="mt-2 text-sm text-muted">Belum ada urunan. Jadilah yang pertama.</p>}
      <ul className="mt-2 divide-y divide-line">
        {data?.map(a => (
          <li key={`${a.hash}-${a.kind}`} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>
              {a.kind === "buy" ? (
                <>
                  <b>{short(a.who)}</b> urunan {num(a.units)} unit
                  {a.roomId ? ` di room #${a.roomId}` : ""}
                </>
              ) : (
                <>Sewa {rp(a.amount)} dibagikan ke pemegang unit</>
              )}
            </span>
            <a
              className="shrink-0 text-xs font-semibold text-brand underline"
              href={txUrl(a.hash)}
              target="_blank"
              rel="noreferrer"
            >
              bukti
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
