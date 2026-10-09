"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { rp, short } from "~~/lib/format";
import { useMe } from "~~/lib/hooks";
import { useI18n } from "~~/lib/i18n";

export function Header() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const me = useMe();
  const path = usePathname();
  const { lang, setLang, t } = useI18n();
  const label = user?.email?.address ?? user?.google?.email ?? short(me.address);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-xl font-black tracking-tight text-brand">
          URSSET
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <button
            className="rounded-full border border-line px-2 py-1 text-xs font-bold text-muted hover:bg-slate-50"
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            aria-label={t("Bahasa")}
            title={t("Bahasa")}
          >
            <span className={lang === "id" ? "text-brand" : ""}>ID</span>
            <span className="px-0.5 text-line">|</span>
            <span className={lang === "en" ? "text-brand" : ""}>EN</span>
          </button>
          <Link href="/portfolio" className={path === "/portfolio" ? "text-brand" : "text-muted"}>
            {t("Portofolio")}
          </Link>
          {!ready ? (
            <span className="btn-ghost pointer-events-none opacity-50">{t("Masuk")}</span>
          ) : authenticated ? (
            <button className="btn-ghost max-w-[8.5rem] truncate" onClick={logout} title={t("Keluar")}>
              <span className="truncate">{me.address ? rp(me.idr) : label}</span>
            </button>
          ) : (
            <button className="btn-ghost" onClick={login}>
              {t("Masuk")}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
