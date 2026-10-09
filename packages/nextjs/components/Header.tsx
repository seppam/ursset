"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { OPEN_MENU_EVENT } from "~~/components/BottomNav";
import { ChartIcon, CloseIcon, CoinIcon, HomeIcon, KeyIcon, MenuIcon, PlusIcon, ShieldIcon } from "~~/components/Icons";
import { Logo } from "~~/components/Logo";
import { EXPLORER_URL } from "~~/lib/chain";
import { rp, short } from "~~/lib/format";
import { useMe } from "~~/lib/hooks";
import { useI18n } from "~~/lib/i18n";

type Item = { href: string; label: string; icon: ReactNode };

const investor: Item[] = [
  { href: "/", label: "Beranda", icon: <HomeIcon size={20} /> },
  { href: "/portfolio", label: "Portofolio", icon: <ChartIcon size={20} /> },
  { href: "/#cara-kerja", label: "Cara kerja", icon: <ShieldIcon size={20} /> },
];
const owner: Item[] = [
  { href: "/operator", label: "Kelola properti", icon: <KeyIcon size={20} /> },
  { href: "/operator#listing", label: "Daftarkan properti", icon: <PlusIcon size={20} /> },
  { href: "/operator#rent", label: "Setor sewa", icon: <CoinIcon size={20} /> },
];

export function Header() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const me = useMe();
  const path = usePathname();
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const label = user?.email?.address ?? user?.google?.email ?? short(me.address);

  // Close the drawer after any navigation, and lock page scroll while it is open.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener(OPEN_MENU_EVENT, openMenu);
    return () => window.removeEventListener(OPEN_MENU_EVENT, openMenu);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const link = (item: Item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${!item.href.includes("#") && path === item.href ? "bg-brand-soft text-brand-dark" : "text-ink hover:bg-slate-50"}`}
    >
      <span aria-hidden className="text-muted">
        {item.icon}
      </span>
      {t(item.label)}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center md:max-w-5xl justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white hover:bg-slate-50"
              onClick={() => setOpen(true)}
              aria-label={t("Menu")}
              aria-expanded={open}
            >
              <MenuIcon size={20} />
            </button>
            <Link href="/" aria-label="URSSET" className="flex min-h-[44px] items-center">
              <Logo size={30} />
            </Link>
            <nav aria-label={t("Navigasi utama")} className="ml-4 hidden items-center gap-1 md:flex">
              {[...investor.slice(0, 2), owner[0]].map(i => (
                <Link
                  key={i.href}
                  href={i.href}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${path === i.href ? "bg-brand-soft text-brand-dark" : "text-muted hover:text-ink"}`}
                >
                  {t(i.label)}
                </Link>
              ))}
            </nav>
          </div>
          {!ready ? (
            <span className="btn-ghost pointer-events-none opacity-50">{t("Masuk")}</span>
          ) : authenticated ? (
            <Link href="/portfolio" className="btn-ghost max-w-[9rem] truncate" title={t("Portofolio")}>
              <span className="truncate">{me.address ? rp(me.idr) : label}</span>
            </Link>
          ) : (
            <button className="btn-ghost" onClick={login}>
              {t("Masuk")}
            </button>
          )}
        </div>
      </header>

      {/* Left drawer */}
      <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-white p-4 shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between">
            <Logo size={34} />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-slate-100"
              onClick={() => setOpen(false)}
              aria-label={t("Tutup menu")}
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t("3 langkah,")} {t("kamu punya aset.")}
          </p>

          <nav className="mt-4 flex-1 overflow-auto">
            <p className="eyebrow px-3 pb-1">{t("Investor")}</p>
            {investor.map(link)}
            <p className="eyebrow px-3 pb-1 pt-4">{t("Pemilik properti")}</p>
            {owner.map(link)}
            <p className="eyebrow px-3 pb-1 pt-4">{t("Bahasa")}</p>
            <div className="flex gap-2 px-3">
              {(["id", "en"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex-1 rounded-full border px-3 py-2 text-sm font-bold ${lang === l ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-muted"}`}
                >
                  {l === "id" ? "Indonesia" : "English"}
                </button>
              ))}
            </div>
          </nav>

          <div className="border-t border-line pt-3 text-sm">
            {ready && authenticated ? (
              <>
                <p className="truncate font-semibold">{label}</p>
                <p className="text-xs text-muted">
                  {t("Saldo Rupiah uji")}: {rp(me.idr)}
                </p>
                <button
                  className="btn-ghost mt-2 w-full"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                >
                  {t("Keluar")}
                </button>
              </>
            ) : (
              <button
                className="btn-main"
                onClick={() => {
                  setOpen(false);
                  login();
                }}
              >
                {t("Masuk")}
              </button>
            )}
            <p className="mt-3 flex gap-3 text-xs">
              <a
                className="font-semibold text-brand underline"
                href="https://github.com/seppam/ursset"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a className="font-semibold text-brand underline" href={EXPLORER_URL} target="_blank" rel="noreferrer">
                Explorer
              </a>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
