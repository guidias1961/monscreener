import { create } from 'zustand'
import { DexScreenerToken, NadFunToken, FilterConfig, SortConfig } from '@/types'

interface AppState {
  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // DEXScreener State
  dexTokens: DexScreenerToken[]
  dexTokensLoading: boolean
  dexTokensError: string | null
  setDexTokens: (tokens: DexScreenerToken[]) => void
  setDexTokensLoading: (loading: boolean) => void
  setDexTokensError: (error: string | null) => void

  // Nad.fun State
  nadFunTokens: NadFunToken[]
  nadFunTokensLoading: boolean
  nadFunTokensError: string | null
  setNadFunTokens: (tokens: NadFunToken[]) => void
  setNadFunTokensLoading: (loading: boolean) => void
  setNadFunTokensError: (error: string | null) => void

  // Filter & Sort State
  filter: FilterConfig
  setFilter: (filter: Partial<FilterConfig>) => void
  resetFilter: () => void

  sortConfig: SortConfig
  setSortConfig: (config: SortConfig) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Selected token for details
  selectedTokenAddress: string | null
  setSelectedTokenAddress: (address: string | null) => void

  // Wallet Analytics
  walletAddress: string
  setWalletAddress: (address: string) => void
}

const defaultFilter: FilterConfig = {
  search: '',
  minMarketCap: undefined,
  maxMarketCap: undefined,
  minVolume: undefined,
  minLiquidity: undefined,
  graduated: undefined
}

const defaultSort: SortConfig = {
  field: 'volume24h',
  direction: 'desc'
}

export const useAppStore = create<AppState>((set) => ({
  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // DEXScreener State
  dexTokens: [],
  dexTokensLoading: false,
  dexTokensError: null,
  setDexTokens: (tokens) => set({ dexTokens: tokens }),
  setDexTokensLoading: (loading) => set({ dexTokensLoading: loading }),
  setDexTokensError: (error) => set({ dexTokensError: error }),

  // Nad.fun State
  nadFunTokens: [],
  nadFunTokensLoading: false,
  nadFunTokensError: null,
  setNadFunTokens: (tokens) => set({ nadFunTokens: tokens }),
  setNadFunTokensLoading: (loading) => set({ nadFunTokensLoading: loading }),
  setNadFunTokensError: (error) => set({ nadFunTokensError: error }),

  // Filter & Sort
  filter: defaultFilter,
  setFilter: (newFilter) => set((state) => ({
    filter: { ...state.filter, ...newFilter }
  })),
  resetFilter: () => set({ filter: defaultFilter }),

  sortConfig: defaultSort,
  setSortConfig: (config) => set({ sortConfig: config }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Selected token
  selectedTokenAddress: null,
  setSelectedTokenAddress: (address) => set({ selectedTokenAddress: address }),

  // Wallet Analytics
  walletAddress: '',
  setWalletAddress: (address) => set({ walletAddress: address })
}))
