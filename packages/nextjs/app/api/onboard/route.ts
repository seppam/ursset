import { dripGas, fail, requireOwner } from "~~/lib/server/operator";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const owner = await requireOwner(req, address);
    const hash = await dripGas(owner);
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
