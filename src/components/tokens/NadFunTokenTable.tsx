'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Copy, Check, Rocket, Users, TrendingUp } from 'lucide-react'
import { NadFunToken } from '@/types'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { cn, formatCurrency, formatNumber, formatPercent, truncateAddress, copyToClipboard, formatTimeAgo, getPriceChangeClass } from '@/lib/utils'
import { getExplorerUrl } from '@/lib/wagmi'

interface NadFunTokenTableProps {
  tokens: NadFunToken[]
  isLoading?: boolean
}

type SortField = 'name' | 'price' | 'priceChange' | 'volume' | 'marketCap' | 'holders' | 'createdAt'

export function NadFunTokenTable({ tokens, isLoading }: NadFunTokenTableProps) {
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const handleCopy = async (address: string) => {
    const success = await copyToClipboard(address)
    if (success) {
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    }
  }

  const sortedTokens = [...tokens].sort((a, b) => {
    let aVal: number, bVal: number

    switch (sortField) {
      case 'name':
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      case 'price':
        aVal = a.price || 0
        bVal = b.price || 0
        break
      case 'priceChange':
        aVal = a.priceChange24h || 0
        bVal = b.priceChange24h || 0
        break
      case 'volume':
        aVal = a.volume24h || 0
        bVal = b.volume24h || 0
        break
      case 'marketCap':
        aVal = a.marketCap || 0
        bVal = b.marketCap || 0
        break
      case 'holders':
        aVal = a.holders || 0
        bVal = b.holders || 0
        break
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-text-muted" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-monad-purple" />
      : <ArrowDown className="h-3 w-3 text-monad-purple" />
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-dark-bg-tertiary/30 rounded-lg animate-pulse">
            <div className="h-10 w-10 rounded-full bg-dark-bg-tertiary" />
            <div className="flex-1 h-4 bg-dark-bg-tertiary rounded" />
            <div className="w-20 h-4 bg-dark-bg-tertiary rounded" />
            <div className="w-16 h-4 bg-dark-bg-tertiary rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12">
        <Rocket className="h-12 w-12 mx-auto text-text-muted mb-4" />
        <p className="text-text-muted">No tokens found on nad.fun</p>
        <p className="text-xs text-text-muted mt-2">Try refreshing or check back later</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-full">
        <thead>
          <tr>
            <th className="w-12">#</th>
            <th>
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Token <SortIcon field="name" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('price')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Price <SortIcon field="price" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('priceChange')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                24h % <SortIcon field="priceChange" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('marketCap')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Market Cap <SortIcon field="marketCap" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('volume')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Volume 24h <SortIcon field="volume" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('holders')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Users className="h-3 w-3" /> Holders <SortIcon field="holders" />
              </button>
            </th>
            <th>Progress</th>
            <th>
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Created <SortIcon field="createdAt" />
              </button>
            </th>
            <th className="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTokens.map((token, index) => (
            <tr key={token.token} className="table-row">
              <td className="text-text-muted font-mono text-xs">{index + 1}</td>
              <td>
                <div className="flex items-center gap-3">
                  <TokenLogo
                    src={token.image}
                    symbol={token.symbol}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{token.name}</span>
                      <span className="text-xs text-text-muted">{token.symbol}</span>
                      {token.graduated && (
                        <span className="badge-success">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Graduated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted font-mono">
                        {truncateAddress(token.token)}
                      </span>
                      <button
                        onClick={() => handleCopy(token.token)}
                        className="text-text-muted hover:text-monad-purple transition-colors"
                      >
                        {copiedAddress === token.token ? (
                          <Check className="h-3 w-3 text-status-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </td>
              <td className="font-mono text-sm">
                {formatCurrency(token.price)}
              </td>
              <td>
                <span className={cn('font-mono text-sm', getPriceChangeClass(token.priceChange24h))}>
                  {formatPercent(token.priceChange24h)}
                </span>
              </td>
              <td className="font-mono text-sm text-text-secondary">
                {formatCurrency(token.marketCap)}
              </td>
              <td className="font-mono text-sm text-text-secondary">
                {formatCurrency(token.volume24h)}
              </td>
              <td className="font-mono text-sm text-text-secondary">
                {formatNumber(token.holders)}
              </td>
              <td>
                {token.bondingCurveProgress !== undefined && (
                  <div className="w-24">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-muted">Progress</span>
                      <span className={cn(
                        'font-mono',
                        token.bondingCurveProgress >= 100 ? 'text-status-success' : 'text-text-secondary'
                      )}>
                        {token.bondingCurveProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-dark-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          token.bondingCurveProgress >= 100
                            ? 'bg-status-success'
                            : 'bg-gradient-monad'
                        )}
                        style={{ width: `${Math.min(token.bondingCurveProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </td>
              <td className="text-xs text-text-muted">
                {token.createdAt && formatTimeAgo(token.createdAt)}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://nad.fun/tokens/${token.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                    title="View on nad.fun"
                  >
                    <Rocket className="h-4 w-4" />
                  </a>
                  <a
                    href={getExplorerUrl('token', token.token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
