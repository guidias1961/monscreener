// DEXScreener Types
export interface DexScreenerToken {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  marketCap: number
  pairCreatedAt: number
  info?: {
    imageUrl?: string
    header?: string
    openGraph?: string
    websites?: { label: string; url: string }[]
    socials?: { type: string; url: string }[]
  }
  boosts?: {
    active: number
  }
}

export interface DexScreenerSearchResponse {
  schemaVersion: string
  pairs: DexScreenerToken[]
}

// Nad.fun Types
export interface NadFunToken {
  token: string
  name: string
  symbol: string
  description?: string
  image?: string
  twitter?: string
  telegram?: string
  website?: string
  creator: string
  createdAt: string
  marketCap: number
  price: number
  priceChange24h?: number
  volume24h?: number
  holders?: number
  totalSupply?: string
  graduated?: boolean
  bondingCurveProgress?: number
}

export interface NadFunOrderResponse {
  tokens: NadFunToken[]
  page: number
  limit: number
  total: number
}

export interface NadFunTokenMarket {
  token: string
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  high24h: number
  low24h: number
}

export interface NadFunHolder {
  address: string
  balance: string
  percentage: number
}

export interface NadFunSwap {
  hash: string
  type: 'buy' | 'sell'
  trader: string
  amount: string
  price: number
  total: number
  timestamp: string
}

// MonArch (Wallet Analytics) Types
export interface WalletInfo {
  address: string
  balance: string
  balanceUsd: number
  transactionCount: number
  tokenHoldings: TokenHolding[]
  recentTransactions: Transaction[]
}

export interface TokenHolding {
  token: string
  name: string
  symbol: string
  balance: string
  decimals: number
  valueUsd: number
  price: number
  logo?: string
}

export interface Transaction {
  hash: string
  blockNumber: number
  timestamp: number
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  status: 'success' | 'failed' | 'pending'
  type: 'transfer' | 'swap' | 'approve' | 'contract_call' | 'unknown'
  tokenTransfers?: TokenTransfer[]
}

export interface TokenTransfer {
  token: string
  name: string
  symbol: string
  decimals: number
  from: string
  to: string
  value: string
  logo?: string
  transactionHash?: string
  blockNumber?: number
  logIndex?: number
}

export interface SwapInfo {
  hash: string
  timestamp: number
  tokenIn: {
    address: string
    symbol: string
    amount: string
    valueUsd: number
  }
  tokenOut: {
    address: string
    symbol: string
    amount: string
    valueUsd: number
  }
  dex: string
  priceImpact?: number
}

// Common Types
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: string
  direction: SortDirection
}

export interface FilterConfig {
  search?: string
  minMarketCap?: number
  maxMarketCap?: number
  minVolume?: number
  minLiquidity?: number
  graduated?: boolean
}

// Chart Types
export interface ChartDataPoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PriceHistory {
  token: string
  data: ChartDataPoint[]
  timeframe: '1h' | '4h' | '1d' | '1w'
}
