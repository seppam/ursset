import { dripGas, fail, requireOwner, verifyWallet } from "~~/lib/server/operator";

// Demo identity check: marks the wallet as verified onchain. No personal data is received or stored.
export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const owner = await requireOwner(req, address);
    await dripGas(owner);
    const hash = await verifyWallet(owner);
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
