// Forwards JSON-RPC calls to the chain so users on networks that block the public RPC domain still work.
const TARGET = process.env.SERVER_RPC_URL || "https://rpc.testnet.chain.robinhood.com";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  const upstream = await fetch(TARGET, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await req.text(),
  });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
