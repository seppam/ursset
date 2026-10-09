"use client";

import { useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { robinhoodTestnet } from "~~/lib/chain";
import { I18nProvider } from "~~/lib/i18n";
import { wagmiConfig } from "~~/lib/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 2000 } } }));

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""}
      config={{
        loginMethods: ["email", "google"],
        defaultChain: robinhoodTestnet,
        supportedChains: [robinhoodTestnet],
        // The wallet is created silently and signs without popups, so users never see "wallet" or "gas".
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" }, showWalletUIs: false },
        appearance: { theme: "light", accentColor: "#0f9d6e" },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <I18nProvider>{children}</I18nProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
