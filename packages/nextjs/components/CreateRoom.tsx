"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { parseEventLogs } from "viem";
import { IntInput } from "~~/components/IntInput";
import { friendlyError } from "~~/lib/format";
import { abis } from "~~/lib/generated/ursset";
import { useSend } from "~~/lib/hooks";
import { useT } from "~~/lib/i18n";
import { useProp } from "~~/lib/properties";

/** Starts an Urunan Room: a shared target friends fill with their own money. */
export function CreateRoom() {
  const t = useT();
  const send = useSend();
  const router = useRouter();
  const { authenticated, login } = usePrivy();
  const { c, info, name } = useProp();
  const [typedTitle, setTitle] = useState<string | null>(null);
  // Default to the property name once it has loaded, until the user types their own title.
  const title = typedTitle ?? `${t("Urunan Kos")} ${name}`.slice(0, 40);
  const [target, setTarget] = useState(1000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const { receipt } = await send({
        ...c.sale,
        functionName: "createRoom",
        args: [title, BigInt(Math.max(10, target))],
      });
      const [event] = parseEventLogs({ abi: abis.PrimarySale, eventName: "RoomCreated", logs: receipt.logs });
      router.push(`/p/${info.id}/room/${event.args.roomId}`);
    } catch (e) {
      setError(t(friendlyError(e)));
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="text-lg font-extrabold">{t("Buat Urunan Room")}</h3>
      <p className="text-sm text-muted">{t("Bagikan satu link, teman ikut dengan nominal masing-masing.")}</p>
      <input
        className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-sm"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={40}
        aria-label={t("Nama room")}
      />
      <label className="mt-2 block text-xs font-semibold text-muted">
        {t("Target unit")}
        <IntInput
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
          value={target}
          onChange={setTarget}
        />
      </label>
      <button
        className="btn-main mt-3"
        disabled={busy || (authenticated && title.trim().length < 2)}
        onClick={authenticated ? create : login}
      >
        {busy ? t("Membuat room…") : authenticated ? t("Buat room dan dapatkan link") : t("Masuk untuk membuat room")}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
