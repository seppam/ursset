import { RPC_URL, robinhoodTestnet } from "./chain";
import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  transports: { [robinhoodTestnet.id]: http(RPC_URL) },
});
