'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, Rocket, Wallet, Activity, ExternalLink, Zap, Shield, Globe, BookOpen } from 'lucide-react'
import { StatsCard, StatsGrid } from '@/components/stats/StatsCard'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { DexScreenerToken, NadFunToken } from '@/types'
import { getAllMonadTokens } from '@/lib/api/dexscreener'
import { getTokensByMarketCap } from '@/lib/api/nadfun'
import { formatCurrency, formatNumber, formatPercent, getPriceChangeClass, cn } from '@/lib/utils'

// Twitter/X Icon Component
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const socialLinks = [
  {
    name: 'Twitter',
    href: 'https://x.com/MonScreener',
    icon: TwitterIcon,
    description: 'Follow us on X',
  },
  {
    name: 'Documentation',
    href: 'https://monscreener.gitbook.io/monscreener-docs/',
    icon: BookOpen,
    description: 'Read the docs',
  },
]

export default function Dashboard() {
  const [dexTokens, setDexTokens] = useState<DexScreenerToken[]>([])
  const [nadFunTokens, setNadFunTokens] = useState<NadFunToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [dex, nadFun] = await Promise.allSettled([
          getAllMonadTokens(),
          getTokensByMarketCap(1, 10)
        ])

        if (dex.status === 'fulfilled') {
          setDexTokens(dex.value.slice(0, 5))
        }

        if (nadFun.status === 'fulfilled') {
          setNadFunTokens(nadFun.value.tokens.slice(0, 5))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalVolume = dexTokens.reduce((sum, t) => sum + (t.volume?.h24 || 0), 0)
  const totalMarketCap = dexTokens.reduce((sum, t) => sum + (t.marketCap || t.fdv || 0), 0)

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-monad-purple/20 via-dark-bg-secondary to-dark-bg p-8 border border-monad-purple/20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Logo */}
          <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-2xl overflow-hidden shadow-glow-purple flex-shrink-0">
            <Image
              src="/logo.png"
              alt="MonScreener Logo"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">
              Mon<span className="text-gradient-monad">Screener</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              Enterprise-grade dashboard for the Monad ecosystem. Track tokens on DEXScreener,
              discover new launches on nad.fun, and analyze wallet activity.
            </p>

            {/* Social Links & Network Status */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              {/* Social Buttons */}
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-bg-tertiary/50 border border-dark-border hover:border-monad-purple/50 hover:bg-monad-purple/10 transition-all duration-200"
                >
                  <link.icon className="h-4 w-4 text-monad-purple" />
                  <span className="text-sm text-text-secondary">{link.name}</span>
                </a>
              ))}

              <div className="hidden md:block w-px h-6 bg-dark-border" />

              {/* Network Status */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
                </span>
                <span className="text-sm text-text-muted">Monad Mainnet</span>
              </div>
              <span className="text-text-muted">•</span>
              <span className="text-sm text-text-muted">Chain ID: 143</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <StatsGrid columns={4}>
        <StatsCard
          title="Total Volume (24h)"
          value={formatCurrency(totalVolume)}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Market Cap"
          value={formatCurrency(totalMarketCap)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Tracked Tokens"
          value={formatNumber(dexTokens.length + nadFunTokens.length)}
          icon={<Globe className="h-5 w-5" />}
        />
        <StatsCard
          title="Network Status"
          value="Operational"
          subtitle="All systems normal"
          icon={<Shield className="h-5 w-5" />}
        />
      </StatsGrid>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dex" className="group">
          <div className="card-base card-hover p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-monad group-hover:shadow-glow-purple transition-all">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">DEXScreener</h3>
                <p className="text-sm text-text-muted">
                  View all Monad tokens listed on DEXScreener with real-time prices, volume, and liquidity data.
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-text-muted group-hover:text-monad-purple transition-colors" />
            </div>
          </div>
        </Link>

        <Link href="/nadfun" className="group">
          <div className="card-base card-hover p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-monad group-hover:shadow-glow-purple transition-all">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Nad.fun</h3>
                <p className="text-sm text-text-muted">
                  Discover new token launches on nad.fun with bonding curve progress, market cap, and volume.
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-text-muted group-hover:text-monad-purple transition-colors" />
            </div>
          </div>
        </Link>

        <Link href="/monarch" className="group">
          <div className="card-base card-hover p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-monad group-hover:shadow-glow-purple transition-all">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">MonArch</h3>
                <p className="text-sm text-text-muted">
                  Analyze wallet addresses - view token holdings, transfers, swaps, and transaction history.
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-text-muted group-hover:text-monad-purple transition-colors" />
            </div>
          </div>
        </Link>
      </div>

      {/* Top Tokens Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top DEXScreener Tokens */}
        <div className="card-base">
          <div className="p-4 border-b border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-monad-purple" />
              <h2 className="font-semibold text-white">Top DEXScreener Tokens</h2>
            </div>
            <Link href="/dex" className="text-sm text-monad-purple hover:text-monad-purple-light">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-dark-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-dark-bg-tertiary" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-dark-bg-tertiary rounded" />
                    <div className="h-3 w-16 bg-dark-bg-tertiary rounded mt-2" />
                  </div>
                  <div className="h-4 w-20 bg-dark-bg-tertiary rounded" />
                </div>
              ))
            ) : dexTokens.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No tokens found
              </div>
            ) : (
              dexTokens.map((token, i) => (
                <div key={token.pairAddress} className="p-4 flex items-center gap-4 hover:bg-dark-bg-tertiary/50 transition-colors">
                  <span className="text-text-muted text-sm w-4">{i + 1}</span>
                  <TokenLogo src={token.info?.imageUrl} symbol={token.baseToken.symbol} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">{token.baseToken.name}</span>
                      <span className="text-xs text-text-muted">{token.baseToken.symbol}</span>
                    </div>
                    <span className="text-xs text-text-muted">
                      Vol: {formatCurrency(token.volume?.h24)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{formatCurrency(parseFloat(token.priceUsd))}</div>
                    <div className={cn('text-xs font-mono', getPriceChangeClass(token.priceChange?.h24))}>
                      {formatPercent(token.priceChange?.h24)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Nad.fun Tokens */}
        <div className="card-base">
          <div className="p-4 border-b border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-monad-purple" />
              <h2 className="font-semibold text-white">Top Nad.fun Tokens</h2>
            </div>
            <Link href="/nadfun" className="text-sm text-monad-purple hover:text-monad-purple-light">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-dark-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-dark-bg-tertiary" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-dark-bg-tertiary rounded" />
                    <div className="h-3 w-16 bg-dark-bg-tertiary rounded mt-2" />
                  </div>
                  <div className="h-4 w-20 bg-dark-bg-tertiary rounded" />
                </div>
              ))
            ) : nadFunTokens.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No tokens found
              </div>
            ) : (
              nadFunTokens.map((token, i) => (
                <div key={token.token} className="p-4 flex items-center gap-4 hover:bg-dark-bg-tertiary/50 transition-colors">
                  <span className="text-text-muted text-sm w-4">{i + 1}</span>
                  <TokenLogo src={token.image} symbol={token.symbol} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">{token.name}</span>
                      <span className="text-xs text-text-muted">{token.symbol}</span>
                      {token.graduated && (
                        <span className="badge-success text-[10px]">Graduated</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">
                      MCap: {formatCurrency(token.marketCap)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{formatCurrency(token.price)}</div>
                    {token.bondingCurveProgress !== undefined && (
                      <div className="text-xs text-text-muted">
                        {token.bondingCurveProgress.toFixed(0)}% bonding
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-base p-6">
          <Zap className="h-8 w-8 text-monad-purple mb-4" />
          <h3 className="font-semibold text-white mb-2">Real-time Data</h3>
          <p className="text-sm text-text-muted">
            Live price updates, volume tracking, and market data directly from DEXScreener and nad.fun APIs.
          </p>
        </div>
        <div className="card-base p-6">
          <Shield className="h-8 w-8 text-monad-purple mb-4" />
          <h3 className="font-semibold text-white mb-2">Secure Connection</h3>
          <p className="text-sm text-text-muted">
            Connect your wallet securely with support for MetaMask, WalletConnect, and other popular wallets.
          </p>
        </div>
        <div className="card-base p-6">
          <Globe className="h-8 w-8 text-monad-purple mb-4" />
          <h3 className="font-semibold text-white mb-2">Full Monad Support</h3>
          <p className="text-sm text-text-muted">
            Built specifically for Monad mainnet with support for all native tokens and DeFi protocols.
          </p>
        </div>
      </div>

      {/* Footer with Social Links */}
      <div className="border-t border-dark-border pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden">
              <Image
                src="/logo.png"
                alt="MonScreener"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-sm text-text-muted">
              MonScreener - Enterprise Monad Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-text-muted hover:text-monad-purple transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span className="text-sm">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
