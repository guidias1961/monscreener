import { http, createConfig } from 'wagmi'
import { getDefaultConfig } from 'connectkit'

// Monad Mainnet Configuration
export const monadMainnet = {
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz'],
      webSocket: ['wss://rpc.monad.xyz'],
    },
    public: {
      http: ['https://rpc.monad.xyz'],
      webSocket: ['wss://rpc.monad.xyz'],
    },
    quicknode: {
      http: ['https://rpc.monad.xyz'],
    },
    alchemy: {
      http: ['https://rpc1.monad.xyz'],
    },
    ankr: {
      http: ['https://rpc3.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'MonadVision',
      url: 'https://monadvision.com',
    },
    monadscan: {
      name: 'Monadscan',
      url: 'https://monadscan.com',
    },
    socialscan: {
      name: 'Socialscan',
      url: 'https://monad.socialscan.io',
    },
  },
  contracts: {
    wmon: {
      address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A' as const,
    },
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11' as const,
    },
  },
} as const

// Create wagmi config
export const config = createConfig(
  getDefaultConfig({
    chains: [monadMainnet],
    transports: {
      [monadMainnet.id]: http('https://rpc.monad.xyz'),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    appName: 'MonScreener',
    appDescription: 'Enterprise Monad Token Dashboard',
    appUrl: 'https://monscreener.app',
    appIcon: '/logo.png',
  })
)

// RPC URLs for load balancing
export const RPC_ENDPOINTS = [
  { url: 'https://rpc.monad.xyz', provider: 'QuickNode', rateLimit: 25 },
  { url: 'https://rpc1.monad.xyz', provider: 'Alchemy', rateLimit: 15 },
  { url: 'https://rpc3.monad.xyz', provider: 'Ankr', rateLimit: 30 },
  { url: 'https://rpc-mainnet.monadinfra.com', provider: 'MF', rateLimit: 20 },
]

// Round-robin RPC selector
let currentRpcIndex = 0
export function getNextRpcUrl(): string {
  const rpc = RPC_ENDPOINTS[currentRpcIndex]
  currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length
  return rpc.url
}

// Canonical contract addresses
export const CONTRACTS = {
  WMON: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
  MULTICALL3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  ENTRY_POINT_V07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
} as const

// Block explorers
export const EXPLORERS = {
  monadvision: 'https://monadvision.com',
  monadscan: 'https://monadscan.com',
  socialscan: 'https://monad.socialscan.io',
} as const

export function getExplorerUrl(type: 'tx' | 'address' | 'token', hash: string, explorer: keyof typeof EXPLORERS = 'monadvision'): string {
  const baseUrl = EXPLORERS[explorer]
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`
    case 'address':
      return `${baseUrl}/address/${hash}`
    case 'token':
      return `${baseUrl}/token/${hash}`
    default:
      return `${baseUrl}/${hash}`
  }
}
