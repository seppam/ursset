const idr = new Intl.NumberFormat("id-ID");

/** Rupiah amount from a whole number (tIDR has zero decimals). */
export const rp = (value: bigint | number | undefined) => `Rp${idr.format(Number(value ?? 0))}`;

export const num = (value: bigint | number | undefined) => idr.format(Number(value ?? 0));

export const short = (address?: string) => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "");

/** Finds the decoded custom error name (for example NotVerified) inside a viem error chain. */
function errorName(error: unknown): string | undefined {
  const walk = (error as { walk?: (fn: (e: unknown) => boolean) => unknown })?.walk;
  const hit = walk?.call(error, (e: unknown) => Boolean((e as { data?: { errorName?: string } })?.data?.errorName)) as
    | { data?: { errorName?: string } }
    | undefined;
  return hit?.data?.errorName;
}

/** Turns contract and wallet errors into plain Indonesian. */
export function friendlyError(error: unknown): string {
  const name = errorName(error);
  const text = String(
    (error as { shortMessage?: string; message?: string })?.shortMessage ?? (error as Error)?.message ?? error,
  );
  const key = name ?? text;
  if (key.includes("NotVerified")) return "Ditolak oleh smart contract: wallet itu belum terverifikasi KYC.";
  if (key.includes("SoldOut")) return "Unit yang tersisa tidak cukup.";
  if (key.includes("InsufficientBalance")) return "Saldo tidak cukup.";
  if (key.includes("InsufficientUnits")) return "Unit yang kamu miliki tidak cukup.";
  if (key.includes("InsufficientAllowance")) return "Izin transfer unit belum diberikan.";
  if (key.includes("NothingToClaim")) return "Belum ada sewa yang bisa diambil.";
  if (key.includes("NotActive")) return "Penawaran ini sudah tidak aktif.";
  if (key.includes("User rejected") || key.includes("denied")) return "Dibatalkan.";
  if (key.includes("insufficient funds")) return "Gas habis. Muat ulang halaman, lalu coba lagi.";
  // Unknown wallet/contract errors (viem) are raw and technical: show a generic translated message instead.
  // Plain Errors come from our own API (already Indonesian messages), so those pass through.
  const isViem = typeof (error as { shortMessage?: unknown })?.shortMessage === "string" || Boolean(name);
  if (isViem || text.length > 160) return "Terjadi kesalahan. Coba lagi sebentar lagi.";
  return text;
}
