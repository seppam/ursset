import { defineChain } from "viem";

export const EXPLORER_URL = "https://explorer.testnet.chain.robinhood.com";

// The browser talks to the chain through this app's own /api/rpc proxy when NEXT_PUBLIC_RPC_URL is set,
// which keeps working on networks that block the public RPC domain.
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.chain.robinhood.com";

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Explorer", url: EXPLORER_URL } },
});

export const txUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER_URL}/address/${address}`;
