"use client";

import { num } from "~~/lib/format";
import { useT } from "~~/lib/i18n";

/** Progress bar that still shows a visible sliver when only a few units are sold. */
export function Progress({ value, max, label = "terjual" }: { value: number; max: number; label?: string }) {
  const t = useT();
  const pct = max > 0 ? (value / max) * 100 : 0;
  const width = value > 0 ? Math.min(100, Math.max(pct, 2)) : 0;
  const shown = pct > 0 && pct < 1 ? "<1" : Math.round(pct).toString();
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {t("{value} dari {max} unit {label} ({pct}%)", {
          value: num(value),
          max: num(max),
          label: t(label),
          pct: shown,
        })}
      </p>
    </div>
  );
}
