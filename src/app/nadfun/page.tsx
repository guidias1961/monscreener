'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Rocket, RefreshCw, Filter, Search, ArrowUpRight, X, TrendingUp, Clock, Flame, Zap } from 'lucide-react'
import { NadFunToken } from '@/types'
import { NadFunTokenTable } from '@/components/tokens/NadFunTokenTable'
import { StatsCard, StatsGrid } from '@/components/stats/StatsCard'
import { getAllNadFunTokens, getTokensByMarketCap, getTokensByCreationTime, getTokensByLatestTrade } from '@/lib/api/nadfun'
import { formatCurrency, formatNumber } from '@/lib/utils'

type OrderType = 'market_cap' | 'creation_time' | 'latest_trade'

export default function NadFunPage() {
  const [tokens, setTokens] = useState<NadFunToken[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<OrderType>('market_cap')
  const [localSearch, setLocalSearch] = useState('')
  const [showGraduatedOnly, setShowGraduatedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTokens = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let data
      switch (orderType) {
        case 'market_cap':
          data = await getTokensByMarketCap(page, 50)
          break
        case 'creation_time':
          data = await getTokensByCreationTime(page, 50)
          break
        case 'latest_trade':
          data = await getTokensByLatestTrade(page, 50)
          break
      }
      setTokens(data.tokens)
      setLastRefresh(new Date())
    } catch (err) {
      setError('Failed to fetch tokens. The nad.fun API might be unavailable.')
      console.error(err)
      // Try to get all tokens as fallback
      try {
        const allTokens = await getAllNadFunTokens()
        setTokens(allTokens)
        setError(null)
      } catch {
        // Keep original error
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orderType, page])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // Auto-refresh for "Newest" tab - every 30 seconds
  useEffect(() => {
    if (orderType === 'creation_time' && autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchTokens(true)
      }, 30000) // 30 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [orderType, autoRefresh, fetchTokens])

  // Enable auto-refresh by default for "Newest" tab
  useEffect(() => {
    if (orderType === 'creation_time') {
      setAutoRefresh(true)
    } else {
      setAutoRefresh(false)
    }
  }, [orderType])

  // Filter tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      // Search filter
      if (localSearch) {
        const search = localSearch.toLowerCase()
        if (
          !token.name.toLowerCase().includes(search) &&
          !token.symbol.toLowerCase().includes(search) &&
          !token.token.toLowerCase().includes(search)
        ) {
          return false
        }
      }

      // Graduated filter
      if (showGraduatedOnly && !token.graduated) {
        return false
      }

      return true
    })
  }, [tokens, localSearch, showGraduatedOnly])

  // Stats
  const stats = useMemo(() => {
    const totalMarketCap = filteredTokens.reduce((sum, t) => sum + (t.marketCap || 0), 0)
    const totalVolume = filteredTokens.reduce((sum, t) => sum + (t.volume24h || 0), 0)
    const graduatedCount = filteredTokens.filter(t => t.graduated).length
    const notGraduatedCount = filteredTokens.filter(t => !t.graduated).length
    const avgProgress = filteredTokens.reduce((sum, t) => sum + (t.bondingCurveProgress || 0), 0) / (filteredTokens.length || 1)

    // For "Newest" tab, calculate tokens created recently
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    const recentTokens = filteredTokens.filter(t => new Date(t.createdAt).getTime() > oneHourAgo).length

    return { totalMarketCap, totalVolume, graduatedCount, notGraduatedCount, avgProgress, recentTokens }
  }, [filteredTokens])

  const orderButtons: { type: OrderType; label: string; icon: React.ReactNode }[] = [
    { type: 'market_cap', label: 'Market Cap', icon: <TrendingUp className="h-4 w-4" /> },
    { type: 'creation_time', label: 'Newest', icon: <Clock className="h-4 w-4" /> },
    { type: 'latest_trade', label: 'Trending', icon: <Flame className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-monad">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Nad.fun Tokens</h1>
            <p className="text-sm text-text-muted">
              Memecoin launchpad on Monad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {orderType === 'creation_time' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-success/10 border border-status-success/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
              </span>
              <span className="text-sm text-status-success font-medium">Live</span>
            </div>
          )}
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
        {orderType === 'creation_time' ? (
          <>
            <StatsCard
              title="New Tokens (1h)"
              value={formatNumber(stats.recentTokens)}
              icon={<Zap className="h-5 w-5" />}
              subtitle="Created recently"
            />
            <StatsCard
              title="On Bonding Curve"
              value={formatNumber(stats.notGraduatedCount)}
              subtitle="Not yet graduated"
            />
            <StatsCard
              title="Graduated"
              value={formatNumber(stats.graduatedCount)}
              subtitle="Listed on DEX"
            />
            <StatsCard
              title="Avg. Progress"
              value={`${stats.avgProgress.toFixed(1)}%`}
              subtitle="Bonding curve"
            />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Market Cap"
              value={formatCurrency(stats.totalMarketCap)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatsCard
              title="Total Volume (24h)"
              value={formatCurrency(stats.totalVolume)}
            />
            <StatsCard
              title="Graduated Tokens"
              value={formatNumber(stats.graduatedCount)}
              subtitle={`of ${filteredTokens.length} total`}
            />
            <StatsCard
              title="Avg. Progress"
              value={`${stats.avgProgress.toFixed(1)}%`}
              subtitle="Bonding curve"
            />
          </>
        )}
      </StatsGrid>

      {/* Order Type Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {orderButtons.map((btn) => (
          <button
            key={btn.type}
            onClick={() => {
              setOrderType(btn.type)
              setPage(1)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              orderType === btn.type
                ? 'bg-monad-purple/10 text-monad-purple border border-monad-purple/30'
                : 'bg-dark-bg-tertiary text-text-secondary hover:text-white border border-transparent'
            }`}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}

        <div className="flex-1" />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showGraduatedOnly}
            onChange={(e) => setShowGraduatedOnly(e.target.checked)}
            className="w-4 h-4 rounded border-dark-border bg-dark-bg-tertiary text-monad-purple focus:ring-monad-purple/20"
          />
          <span className="text-sm text-text-secondary">Graduated only</span>
        </label>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search tokens by name, symbol, or contract address..."
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
        <div className="card-base p-4 border-status-warning/50 bg-status-warning-bg">
          <p className="text-status-warning">{error}</p>
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
            href="https://nad.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-monad-purple hover:text-monad-purple-light"
          >
            Launch on nad.fun <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <NadFunTokenTable tokens={filteredTokens} isLoading={loading} />
      </div>

      {/* Pagination */}
      {!loading && tokens.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-text-secondary">
            Page {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={tokens.length < 50}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
