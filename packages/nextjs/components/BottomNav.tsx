"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, HomeIcon, KeyIcon, UserIcon } from "~~/components/Icons";
import { useT } from "~~/lib/i18n";

export const OPEN_MENU_EVENT = "ursset:open-menu";

const tabs = [
  { href: "/", label: "Beranda", Icon: HomeIcon, match: (p: string) => p === "/" || p.startsWith("/p/") },
  { href: "/portfolio", label: "Portofolio", Icon: ChartIcon, match: (p: string) => p.startsWith("/portfolio") },
  { href: "/operator", label: "Kelola", Icon: KeyIcon, match: (p: string) => p.startsWith("/operator") },
  { href: "/profile", label: "Profil", Icon: UserIcon, match: (p: string) => p.startsWith("/profile") },
];

/** Mobile tab bar: the three main places plus the menu drawer. Hidden on desktop, where the header has links. */
export function BottomNav() {
  const t = useT();
  const path = usePathname();
  const cls = "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold";
  return (
    <nav
      aria-label={t("Navigasi utama")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-md">
        {tabs.map(({ href, label, Icon, match }) => {
          const on = match(path);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={`${cls} ${on ? "text-brand-dark" : "text-muted"}`}
            >
              <span className={`rounded-full px-4 py-1 ${on ? "bg-brand-soft" : ""}`}>
                <Icon size={22} />
              </span>
              {t(label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
