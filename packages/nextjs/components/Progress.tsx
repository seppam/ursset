export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{pct}% terkumpul</p>
    </div>
  );
}
