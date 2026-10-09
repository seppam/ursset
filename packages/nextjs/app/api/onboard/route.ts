import { dripGas, fail, requireUser } from "~~/lib/server/operator";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const user = await requireUser(req, address);
    const hash = await dripGas(req, user.userId, user.address);
    return Response.json({ ok: true, hash });
  } catch (e) {
    return fail(e);
  }
}
