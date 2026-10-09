import { HttpError, depositRent, fail, requireOperatorCode } from "~~/lib/server/operator";

export async function POST(req: Request) {
  try {
    const { passcode, propertyId, amount } = await req.json();
    requireOperatorCode(passcode);
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 1) throw new HttpError(400, "Nominal tidak valid");
    const hash = await depositRent(Number(propertyId ?? 0), BigInt(value));
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
