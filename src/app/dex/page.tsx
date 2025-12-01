'use client'

import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, RefreshCw, Filter, Search, ArrowUpRight, X } from 'lucide-react'
import { DexScreenerToken } from '@/types'
import { TokenTable } from '@/components/tokens/TokenTable'
import { StatsCard, StatsGrid } from '@/components/stats/StatsCard'
import { getAllMonadTokens, searchMonadTokens } from '@/lib/api/dexscreener'
import { formatCurrency, formatNumber, debounce } from '@/lib/utils'
import { useAppStore } from '@/store'

export default function DEXScreenerPage() {
  const [tokens, setTokens] = useState<DexScreenerToken[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { searchQuery, setSearchQuery } = useAppStore()
  const [localSearch, setLocalSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [minVolume, setMinVolume] = useState<number | undefined>()
  const [minLiquidity, setMinLiquidity] = useState<number | undefined>()

  const fetchTokens = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const data = await getAllMonadTokens()
      setTokens(data)
    } catch (err) {
      setError('Failed to fetch tokens. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (query.length >= 2) {
        setLoading(true)
        try {
          const results = await searchMonadTokens(query)
          setTokens(results)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      } else if (query.length === 0) {
        fetchTokens()
      }
    }, 500),
    []
  )

  useEffect(() => {
    debouncedSearch(localSearch)
  }, [localSearch, debouncedSearch])

  // Filter tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      if (minVolume && (token.volume?.h24 || 0) < minVolume) return false
      if (minLiquidity && (token.liquidity?.usd || 0) < minLiquidity) return false
      return true
    })
  }, [tokens, minVolume, minLiquidity])

  // Stats
  const stats = useMemo(() => {
    const totalVolume = filteredTokens.reduce((sum, t) => sum + (t.volume?.h24 || 0), 0)
    const totalLiquidity = filteredTokens.reduce((sum, t) => sum + (t.liquidity?.usd || 0), 0)
    const totalMarketCap = filteredTokens.reduce((sum, t) => sum + (t.marketCap || t.fdv || 0), 0)
    const avgChange = filteredTokens.length > 0
      ? filteredTokens.reduce((sum, t) => sum + (t.priceChange?.h24 || 0), 0) / filteredTokens.length
      : 0

    return { totalVolume, totalLiquidity, totalMarketCap, avgChange }
  }, [filteredTokens])

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-monad">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DEXScreener Tokens</h1>
            <p className="text-sm text-text-muted">
              All Monad tokens listed on DEXScreener
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-monad-purple/50 text-monad-purple' : ''}`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={() => fetchTokens(true)}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid columns={4}>
        <StatsCard
          title="Total Volume (24h)"
          value={formatCurrency(stats.totalVolume)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Liquidity"
          value={formatCurrency(stats.totalLiquidity)}
        />
        <StatsCard
          title="Total Market Cap"
          value={formatCurrency(stats.totalMarketCap)}
        />
        <StatsCard
          title="Avg. Price Change"
          value={`${stats.avgChange >= 0 ? '+' : ''}${stats.avgChange.toFixed(2)}%`}
          change={stats.avgChange}
        />
      </StatsGrid>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card-base p-4 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Filters</h3>
            <button
              onClick={() => {
                setMinVolume(undefined)
                setMinLiquidity(undefined)
              }}
              className="text-sm text-monad-purple hover:text-monad-purple-light"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Min Volume (24h)</label>
              <input
                type="number"
                placeholder="e.g., 10000"
                value={minVolume || ''}
                onChange={(e) => setMinVolume(e.target.value ? Number(e.target.value) : undefined)}
                className="input-base py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Min Liquidity</label>
              <input
                type="number"
                placeholder="e.g., 50000"
                value={minLiquidity || ''}
                onChange={(e) => setMinLiquidity(e.target.value ? Number(e.target.value) : undefined)}
                className="input-base py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search tokens by name, symbol, or address..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="input-base pl-12 py-3"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-dark-bg-tertiary text-text-muted"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="card-base p-4 border-status-error/50 bg-status-error-bg">
          <p className="text-status-error">{error}</p>
          <button
            onClick={() => fetchTokens()}
            className="mt-2 text-sm text-monad-purple hover:text-monad-purple-light"
          >
            Try again
          </button>
        </div>
      )}

      {/* Token Table */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <h2 className="font-semibold text-white">
            {filteredTokens.length} Tokens
          </h2>
          <a
            href="https://dexscreener.com/monad"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-monad-purple hover:text-monad-purple-light"
          >
            View on DEXScreener <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <TokenTable tokens={filteredTokens} isLoading={loading} />
      </div>
    </div>
  )
}
