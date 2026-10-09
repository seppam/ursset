import { HttpError, fail, mintRupiah, requireOwner } from "~~/lib/server/operator";

// Simulates a QRIS top-up through a licensed payment provider by minting test Rupiah (tIDR).
export async function POST(req: Request) {
  try {
    const { address, amount } = await req.json();
    const owner = await requireOwner(req, address);
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 10_000 || value > 1_000_000)
      throw new HttpError(400, "Nominal harus Rp10.000 sampai Rp1.000.000");
    const hash = await mintRupiah(owner, BigInt(value));
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
