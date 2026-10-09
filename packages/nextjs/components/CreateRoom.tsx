"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEventLogs } from "viem";
import { sale } from "~~/lib/contracts";
import { friendlyError } from "~~/lib/format";
import { useSend } from "~~/lib/hooks";

/** Starts an Urunan Room: a shared target friends fill with their own money. */
export function CreateRoom() {
  const send = useSend();
  const router = useRouter();
  const [title, setTitle] = useState("Urunan Kos Melati");
  const [target, setTarget] = useState(1000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const { receipt } = await send({ ...sale, functionName: "createRoom", args: [title, BigInt(target)] });
      const [event] = parseEventLogs({ abi: sale.abi, eventName: "RoomCreated", logs: receipt.logs });
      router.push(`/room/${event.args.roomId}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="text-lg font-extrabold">Buat Urunan Room</h3>
      <p className="text-sm text-muted">Bagikan satu link, teman ikut dengan nominal masing-masing.</p>
      <input
        className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={40}
        aria-label="Nama room"
      />
      <label className="mt-2 block text-xs font-semibold text-muted">
        Target unit
        <input
          type="number"
          min={10}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          value={target}
          onChange={e => setTarget(Math.max(10, Number(e.target.value)))}
        />
      </label>
      <button className="btn-main mt-3" disabled={busy || title.trim().length < 2} onClick={create}>
        {busy ? "Membuat room…" : "Buat room dan dapatkan link"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
