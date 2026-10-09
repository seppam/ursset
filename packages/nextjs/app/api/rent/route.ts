import { HttpError, depositRent, fail } from "~~/lib/server/operator";

export async function POST(req: Request) {
  try {
    const { passcode, amount } = await req.json();
    const expected = process.env.OPERATOR_PASSCODE;
    if (!expected || passcode !== expected) throw new HttpError(401, "Kode operator salah");
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 1) throw new HttpError(400, "Nominal tidak valid");
    const hash = await depositRent(BigInt(value));
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
