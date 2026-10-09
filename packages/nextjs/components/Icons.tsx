import type { ReactNode } from "react";

type P = { size?: number; className?: string };

const base = (size: number, className: string | undefined, children: ReactNode) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={className}
  >
    {children}
  </svg>
);

export const HomeIcon = ({ size = 22, className }: P) =>
  base(size, className, <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5" />);
export const ChartIcon = ({ size = 22, className }: P) =>
  base(size, className, <path d="M4 19.5h16M6.5 16v-4M12 16V7M17.5 16v-6.5" />);
export const KeyIcon = ({ size = 22, className }: P) =>
  base(size, className, <path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6M3 20h18" />);
export const MenuIcon = ({ size = 22, className }: P) => base(size, className, <path d="M4 7h16M4 12h16M4 17h16" />);
export const CloseIcon = ({ size = 22, className }: P) => base(size, className, <path d="M6 6l12 12M18 6 6 18" />);
export const PlusIcon = ({ size = 22, className }: P) => base(size, className, <path d="M12 5v14M5 12h14" />);
export const CoinIcon = ({ size = 22, className }: P) =>
  base(
    size,
    className,
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M9.5 10.2c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.8-2.5.8-2.5 1.8 1 1.7 2.5 1.7 2.5-.7 2.5-1.7" />
    </>,
  );
export const ShieldIcon = ({ size = 22, className }: P) =>
  base(
    size,
    className,
    <path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6l-7-2.5ZM9 12l2.2 2.2L15.5 10" />,
  );
export const SwapIcon = ({ size = 22, className }: P) => base(size, className, <path d="M5 8h13l-3-3M19 16H6l3 3" />);
export const UsersIcon = ({ size = 22, className }: P) =>
  base(
    size,
    className,
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.5-3 2.6-4.5 5.5-4.5s5 1.5 5.5 4.5M16 6.5a3 3 0 0 1 0 5.5M17.5 14.7c1.7.5 2.7 1.8 3 4.3" />
    </>,
  );

export const UserIcon = ({ size = 22, className }: P) =>
  base(
    size,
    className,
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>,
  );
