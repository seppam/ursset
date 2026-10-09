/** URSSET mark: a house whose body is a "U" holding a coin, the pooled money. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="URSSET" className="shrink-0">
      <defs>
        <linearGradient id="ursset-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f9d6e" />
          <stop offset="1" stopColor="#0a7a54" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#ursset-g)" />
      <polyline
        points="88,252 256,112 424,252"
        fill="none"
        stroke="#fff"
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M164 262 V330 a92 92 0 0 0 184 0 V262"
        fill="none"
        stroke="#fff"
        strokeWidth="42"
        strokeLinecap="round"
      />
      <circle cx="256" cy="318" r="28" fill="#fbbf24" />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-xl font-black tracking-tight text-brand">URSSET</span>
    </span>
  );
}
