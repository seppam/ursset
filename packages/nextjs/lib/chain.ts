import { defineChain } from "viem";

export const EXPLORER_URL = "https://explorer.testnet.chain.robinhood.com";

const DIRECT_RPC = "https://rpc.testnet.chain.robinhood.com";

// In the browser every RPC call goes through this app's own /api/rpc proxy, so users on networks that block the
// public RPC domain still work. Servers and scripts talk to the chain directly.
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || (typeof window !== "undefined" ? `${window.location.origin}/api/rpc` : DIRECT_RPC);

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Explorer", url: EXPLORER_URL } },
});

export const txUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER_URL}/address/${address}`;
