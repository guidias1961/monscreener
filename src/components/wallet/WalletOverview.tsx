'use client'

import { Copy, Check, ExternalLink, Wallet, Coins, ArrowRightLeft, Clock } from 'lucide-react'
import { useState } from 'react'
import { WalletInfo } from '@/types'
import { StatsCard, StatsGrid } from '@/components/stats/StatsCard'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { cn, formatCurrency, formatNumber, truncateAddress, copyToClipboard, parseTokenAmount } from '@/lib/utils'
import { getExplorerUrl } from '@/lib/wagmi'

interface WalletOverviewProps {
  wallet: WalletInfo
  isLoading?: boolean
}

export function WalletOverview({ wallet, isLoading }: WalletOverviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(wallet.address)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const monBalance = parseTokenAmount(BigInt(wallet.balance || '0'), 18)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card-base p-6 animate-pulse">
          <div className="h-6 w-48 bg-dark-bg-tertiary rounded mb-4" />
          <div className="h-4 w-96 bg-dark-bg-tertiary rounded" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base p-4 animate-pulse">
              <div className="h-4 w-20 bg-dark-bg-tertiary rounded mb-2" />
              <div className="h-6 w-24 bg-dark-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Address Header */}
      <div className="card-base p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-monad">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Wallet Overview</h1>
                <div className="flex items-center gap-2 mt-1">
                  <code className="font-mono text-sm text-text-secondary">
                    {truncateAddress(wallet.address, 10, 8)}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-status-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl('address', wallet.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-muted">Net Worth</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(wallet.balanceUsd)}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid columns={4}>
        <StatsCard
          title="MON Balance"
          value={formatNumber(monBalance)}
          subtitle="Native token"
          icon={<Coins className="h-5 w-5" />}
        />
        <StatsCard
          title="Token Holdings"
          value={wallet.tokenHoldings.length}
          subtitle="Different tokens"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatsCard
          title="Transactions"
          value={formatNumber(wallet.transactionCount)}
          subtitle="Total tx count"
          icon={<ArrowRightLeft className="h-5 w-5" />}
        />
        <StatsCard
          title="Portfolio Value"
          value={formatCurrency(wallet.balanceUsd)}
          subtitle="USD value"
          icon={<Clock className="h-5 w-5" />}
        />
      </StatsGrid>

      {/* Token Holdings */}
      <div className="card-base">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-white">Token Holdings</h2>
        </div>
        {wallet.tokenHoldings.length === 0 ? (
          <div className="p-8 text-center">
            <Coins className="h-12 w-12 mx-auto text-text-muted mb-4" />
            <p className="text-text-muted">No tokens found in this wallet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Balance</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallet.tokenHoldings.map((holding) => (
                  <tr key={holding.token} className="table-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <TokenLogo
                          src={holding.logo}
                          symbol={holding.symbol}
                          size="sm"
                        />
                        <div>
                          <span className="font-medium text-white">{holding.name}</span>
                          <span className="ml-2 text-xs text-text-muted">{holding.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">
                      {formatNumber(parseTokenAmount(BigInt(holding.balance), holding.decimals))}
                    </td>
                    <td className="font-mono text-sm text-text-secondary">
                      {formatCurrency(holding.price)}
                    </td>
                    <td className="font-mono text-sm">
                      {formatCurrency(holding.valueUsd)}
                    </td>
                    <td>
                      <a
                        href={getExplorerUrl('token', holding.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
