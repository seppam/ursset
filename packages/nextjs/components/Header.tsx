"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Logo } from "~~/components/Logo";
import { EXPLORER_URL } from "~~/lib/chain";
import { rp, short } from "~~/lib/format";
import { useMe } from "~~/lib/hooks";
import { useI18n } from "~~/lib/i18n";

type Item = { href: string; label: string; icon: string };

const investor: Item[] = [
  { href: "/", label: "Beranda", icon: "🏠" },
  { href: "/portfolio", label: "Portofolio", icon: "📈" },
];
const owner: Item[] = [
  { href: "/operator#listing", label: "Daftarkan properti", icon: "➕" },
  { href: "/operator#rent", label: "Setor sewa", icon: "💸" },
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
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${path === item.href.split("#")[0] ? "bg-brand-soft text-brand-dark" : "text-ink hover:bg-slate-50"}`}
    >
      <span aria-hidden>{item.icon}</span>
      {t(item.label)}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-lg hover:bg-slate-50"
              onClick={() => setOpen(true)}
              aria-label={t("Menu")}
              aria-expanded={open}
            >
              ☰
            </button>
            <Link href="/" aria-label="URSSET">
              <Logo size={30} />
            </Link>
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
              className="h-9 w-9 rounded-full text-lg text-muted hover:bg-slate-100"
              onClick={() => setOpen(false)}
              aria-label={t("Tutup menu")}
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t("3 langkah,")} {t("kamu punya aset.")}
          </p>

          <nav className="mt-4 flex-1 overflow-auto">
            <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-muted">{t("Investor")}</p>
            {investor.map(link)}
            <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-muted">
              {t("Pemilik properti")}
            </p>
            {owner.map(link)}
            <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-muted">{t("Bahasa")}</p>
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
