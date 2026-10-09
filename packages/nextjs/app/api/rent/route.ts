import { HttpError, depositRent, fail, requireOperatorCode } from "~~/lib/server/operator";

export async function POST(req: Request) {
  try {
    const { passcode, propertyId, amount } = await req.json();
    await requireOperatorCode(req, passcode);
    // Only a real positive whole number: no strings like "1e3", no fractions, no 0.
    if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 1)
      throw new HttpError(400, "Nominal sewa harus bilangan bulat lebih dari 0");
    const id = Number(propertyId ?? 0);
    // depositRent enforces the per-unit cap (5% of the unit price) against the on-chain unit price.
    const hash = await depositRent(id, BigInt(amount));
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
