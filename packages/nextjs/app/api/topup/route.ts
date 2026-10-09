import { clientIp, rateLimit, reserveTopup, withLock } from "~~/lib/server/guard";
import { HttpError, fail, mintRupiah, requireUser } from "~~/lib/server/operator";

// Simulates a QRIS top-up through a licensed payment provider by minting test Rupiah (tIDR).
export async function POST(req: Request) {
  try {
    const { address, amount } = await req.json();
    rateLimit(`topup-ip:${clientIp(req)}`, 20, 10 * 60_000);
    const { address: owner, userId } = await requireUser(req, address);
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 10_000 || amount > 1_000_000)
      throw new HttpError(400, "Nominal harus Rp10.000 sampai Rp1.000.000");
    // One top-up per user at a time: the balance check and the mint cannot be raced from parallel requests.
    const hash = await withLock(`topup:${userId}`, async () => {
      const refund = reserveTopup(userId, amount);
      try {
        return await mintRupiah(owner, BigInt(amount));
      } catch (e) {
        refund();
        throw e;
      }
    });
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
