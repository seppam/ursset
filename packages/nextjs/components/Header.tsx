"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { rp, short } from "~~/lib/format";
import { useMe } from "~~/lib/hooks";

export function Header() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const me = useMe();
  const path = usePathname();
  const label = user?.email?.address ?? user?.google?.email ?? short(me.address);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-black tracking-tight text-brand">
          URSSET
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <Link href="/portfolio" className={path === "/portfolio" ? "text-brand" : "text-muted"}>
            Portofolio
          </Link>
          {!ready ? null : authenticated ? (
            <button className="btn-ghost max-w-[11rem] truncate" onClick={logout} title="Keluar">
              <span className="truncate">{me.address ? rp(me.idr) : label}</span>
            </button>
          ) : (
            <button className="btn-ghost" onClick={login}>
              Masuk
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
