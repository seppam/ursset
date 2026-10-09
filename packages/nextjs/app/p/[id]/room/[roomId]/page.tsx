"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { Progress } from "~~/components/Progress";
import { ThreeSteps } from "~~/components/ThreeSteps";
import { num, short } from "~~/lib/format";
import { useMe } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { PropertyProvider, useProp, useProperties } from "~~/lib/properties";

function Room({ roomNumber }: { roomNumber: string }) {
  const t = useT();
  const { c, info, name } = useProp();
  const roomId = BigInt(/^\d+$/.test(roomNumber) ? roomNumber : "0");
  const me = useMe();
  const [copied, setCopied] = useState(false);

  const { data: room, isLoading } = useReadContract({
    ...c.sale,
    functionName: "rooms",
    args: [roomId],
    query: { enabled: roomId > 0n, refetchInterval: 4000 },
  });
  const { data: mine } = useReadContract({
    ...c.sale,
    functionName: "contributed",
    args: [roomId, me.address!],
    query: { enabled: !!me.address && roomId > 0n, refetchInterval: 4000 },
  });

  if (isLoading) return <p className="pt-6 text-center text-muted">{t("Memuat room…")}</p>;
  if (!room || room[0] === "0x0000000000000000000000000000000000000000") {
    return <p className="pt-6 text-center text-muted">{t("Room tidak ditemukan.")}</p>;
  }
  const [creator, title, target, raised, contributors] = room;

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: title, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <span className="chip">{t("Urunan Room #{id}", { id: roomNumber })}</span>
        <h1 className="mt-2 text-2xl font-black">{title}</h1>
        <Link href={`/p/${info.id}`} className="text-sm font-semibold text-brand underline">
          {name}
        </Link>
        <p className="text-sm text-muted">
          {t("Dibuat oleh {who} · {n} orang ikut", { who: short(creator), n: num(contributors) })}
        </p>
        <div className="mt-4">
          <Progress value={Number(raised)} max={Number(target)} label="terkumpul" />
        </div>
        {mine ? (
          <p className="mt-3 text-sm font-semibold text-brand-dark">{t("Kontribusimu: {n} unit", { n: num(mine) })}</p>
        ) : null}
        <button className="btn-ghost mt-4 w-full" onClick={share}>
          {copied ? t("Link disalin") : t("Ajak teman urunan")}
        </button>
      </section>
      <ThreeSteps roomId={roomId} />
    </div>
  );
}

export default function RoomPage({ params }: { params: Promise<{ id: string; roomId: string }> }) {
  const { id, roomId } = use(params);
  const t = useT();
  const { data: properties, isLoading } = useProperties();
  const info = properties?.find(p => String(p.id) === id);
  if (isLoading || (!properties && !info)) return <p className="pt-6 text-center text-muted">{t("Memuat…")}</p>;
  if (!info) return <p className="pt-6 text-center text-muted">{t("Properti tidak ditemukan.")}</p>;
  return (
    <PropertyProvider info={info}>
      <Room roomNumber={roomId} />
    </PropertyProvider>
  );
}
