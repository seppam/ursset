import { clientIp, rateLimit } from "~~/lib/server/guard";

// Forwards JSON-RPC calls to the chain so users on networks that block the public RPC domain still work.
const TARGET = process.env.SERVER_RPC_URL || "https://rpc.testnet.chain.robinhood.com";
const MAX_BODY = 64 * 1024;
const MAX_BATCH = 20;

// Read-only calls plus raw transaction broadcast; no admin, debug, personal or unsigned-send methods.
const ALLOWED = new Set([
  "eth_chainId",
  "net_version",
  "web3_clientVersion",
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_getStorageAt",
  "eth_getTransactionCount",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getLogs",
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_sendRawTransaction",
]);

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
const rpcError = (status: number, message: string) =>
  json({ jsonrpc: "2.0", id: null, error: { code: -32600, message } }, status);

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  try {
    rateLimit(`rpc-ip:${clientIp(req)}`, 600, 60_000);
    const raw = await req.text();
    if (raw.length > MAX_BODY) return rpcError(413, "Request too large");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return rpcError(400, "Invalid JSON");
    }
    const calls = Array.isArray(parsed) ? parsed : [parsed];
    if (!calls.length || calls.length > MAX_BATCH) return rpcError(400, "Bad batch size");
    for (const c of calls) {
      const method = (c as { method?: unknown } | null)?.method;
      if (typeof method !== "string" || !ALLOWED.has(method)) return rpcError(403, "Method not allowed");
    }
    const upstream = await fetch(TARGET, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw,
      signal: AbortSignal.timeout(15_000),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Error && "status" in e && (e as { status: number }).status === 429)
      return rpcError(429, "Too many requests");
    return rpcError(502, "Upstream RPC unavailable");
  }
}
