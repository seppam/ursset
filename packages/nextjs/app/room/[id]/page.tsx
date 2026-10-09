"use client";

import { use, useState } from "react";
import { useReadContract } from "wagmi";
import { Progress } from "~~/components/Progress";
import { ThreeSteps } from "~~/components/ThreeSteps";
import { isDeployed, sale } from "~~/lib/contracts";
import { num, short } from "~~/lib/format";
import { useMe } from "~~/lib/hooks";

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const roomId = BigInt(/^\d+$/.test(id) ? id : "0");
  const me = useMe();
  const [copied, setCopied] = useState(false);

  const { data: room, isLoading } = useReadContract({
    ...sale,
    functionName: "rooms",
    args: [roomId],
    query: { enabled: isDeployed && roomId > 0n, refetchInterval: 4000 },
  });
  const { data: mine } = useReadContract({
    ...sale,
    functionName: "contributed",
    args: [roomId, me.address!],
    query: { enabled: isDeployed && !!me.address && roomId > 0n, refetchInterval: 4000 },
  });

  if (isLoading) return <p className="pt-6 text-center text-muted">Memuat room…</p>;
  if (!room || room[0] === "0x0000000000000000000000000000000000000000") {
    return <p className="pt-6 text-center text-muted">Room tidak ditemukan.</p>;
  }
  const [creator, title, target, raised, contributors] = room;

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `Ikut urunan: ${title}`, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <span className="chip">Urunan Room #{id}</span>
        <h1 className="mt-2 text-2xl font-black">{title}</h1>
        <p className="text-sm text-muted">
          Dibuat oleh {short(creator)} · {num(contributors)} orang ikut
        </p>
        <div className="mt-4">
          <Progress value={Number(raised)} max={Number(target)} />
          <p className="mt-1 text-sm">
            <b>{num(raised)}</b> dari {num(target)} unit
          </p>
        </div>
        {mine ? <p className="mt-3 text-sm font-semibold text-brand-dark">Kontribusimu: {num(mine)} unit</p> : null}
        <button className="btn-ghost mt-4 w-full" onClick={share}>
          {copied ? "Link disalin" : "Ajak teman urunan"}
        </button>
      </section>
      <ThreeSteps roomId={roomId} />
    </div>
  );
}
