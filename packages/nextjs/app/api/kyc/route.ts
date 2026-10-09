import { dripGas, fail, requireUser, verifyWallet } from "~~/lib/server/operator";

// Demo identity check: marks the wallet as verified onchain. No personal data is received or stored.
export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const user = await requireUser(req, address);
    await dripGas(req, user.userId, user.address);
    const hash = await verifyWallet(user.address);
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
