'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { config } from '@/lib/wagmi'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          customTheme={{
            '--ck-font-family': '"Inter", system-ui, sans-serif',
            '--ck-border-radius': '12px',
            '--ck-overlay-background': 'rgba(0, 0, 0, 0.85)',
            '--ck-body-background': '#16161A',
            '--ck-body-background-secondary': '#1A1A1F',
            '--ck-body-background-tertiary': '#131316',
            '--ck-body-color': '#FFFFFF',
            '--ck-body-color-muted': '#A1A1AA',
            '--ck-body-color-muted-hover': '#FFFFFF',
            '--ck-primary-button-background': '#836EF9',
            '--ck-primary-button-hover-background': '#5B3FD9',
            '--ck-primary-button-border-radius': '8px',
            '--ck-secondary-button-background': '#1A1A1F',
            '--ck-secondary-button-border-radius': '8px',
            '--ck-focus-color': '#836EF9',
            '--ck-modal-box-shadow': '0 0 40px rgba(131, 110, 249, 0.2)',
          }}
          options={{
            embedGoogleFonts: true,
            walletConnectName: 'Other Wallets',
            hideNoWalletCTA: false,
            hideQuestionMarkCTA: false,
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
