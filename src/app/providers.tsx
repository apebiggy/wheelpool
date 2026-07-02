'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { abstractTestnet } from 'viem/chains';
import { injected } from 'wagmi/connectors';
import { createConfig } from '@privy-io/wagmi';
import { toPrivyWalletConnector } from '@abstract-foundation/agw-react/connectors';

const config = createConfig({
  chains: [abstractTestnet],
  connectors: [
    toPrivyWalletConnector(),  // AGW as primary
    injected(),                 // MetaMask / Rabby as fallback
  ],
  transports: {
    [abstractTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        defaultChain: abstractTestnet,
        supportedChains: [abstractTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#1BF26A',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
