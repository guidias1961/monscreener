'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Copy, Check } from 'lucide-react'
import { DexScreenerToken } from '@/types'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { cn, formatCurrency, formatNumber, formatPercent, truncateAddress, copyToClipboard, getPriceChangeClass } from '@/lib/utils'
import { getExplorerUrl } from '@/lib/wagmi'

interface TokenTableProps {
  tokens: DexScreenerToken[]
  isLoading?: boolean
}

type SortField = 'name' | 'price' | 'priceChange' | 'volume' | 'liquidity' | 'marketCap'

export function TokenTable({ tokens, isLoading }: TokenTableProps) {
  const [sortField, setSortField] = useState<SortField>('volume')
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
          ? a.baseToken.name.localeCompare(b.baseToken.name)
          : b.baseToken.name.localeCompare(a.baseToken.name)
      case 'price':
        aVal = parseFloat(a.priceUsd) || 0
        bVal = parseFloat(b.priceUsd) || 0
        break
      case 'priceChange':
        aVal = a.priceChange?.h24 || 0
        bVal = b.priceChange?.h24 || 0
        break
      case 'volume':
        aVal = a.volume?.h24 || 0
        bVal = b.volume?.h24 || 0
        break
      case 'liquidity':
        aVal = a.liquidity?.usd || 0
        bVal = b.liquidity?.usd || 0
        break
      case 'marketCap':
        aVal = a.marketCap || a.fdv || 0
        bVal = b.marketCap || b.fdv || 0
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
        <p className="text-text-muted">No tokens found</p>
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
                onClick={() => handleSort('volume')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Volume 24h <SortIcon field="volume" />
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('liquidity')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Liquidity <SortIcon field="liquidity" />
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
            <th>Txns 24h</th>
            <th className="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTokens.map((token, index) => (
            <tr key={token.pairAddress} className="table-row">
              <td className="text-text-muted font-mono text-xs">{index + 1}</td>
              <td>
                <div className="flex items-center gap-3">
                  <TokenLogo
                    src={token.info?.imageUrl}
                    symbol={token.baseToken.symbol}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{token.baseToken.name}</span>
                      <span className="text-xs text-text-muted">{token.baseToken.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted font-mono">
                        {truncateAddress(token.baseToken.address)}
                      </span>
                      <button
                        onClick={() => handleCopy(token.baseToken.address)}
                        className="text-text-muted hover:text-monad-purple transition-colors"
                      >
                        {copiedAddress === token.baseToken.address ? (
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
                {formatCurrency(parseFloat(token.priceUsd))}
              </td>
              <td>
                <span className={cn('font-mono text-sm', getPriceChangeClass(token.priceChange?.h24))}>
                  {formatPercent(token.priceChange?.h24)}
                </span>
              </td>
              <td className="font-mono text-sm text-text-secondary">
                {formatCurrency(token.volume?.h24)}
              </td>
              <td className="font-mono text-sm text-text-secondary">
                {formatCurrency(token.liquidity?.usd)}
              </td>
              <td className="font-mono text-sm text-text-secondary">
                {formatCurrency(token.marketCap || token.fdv)}
              </td>
              <td>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-status-success">{token.txns?.h24?.buys || 0} buys</span>
                  <span className="text-text-muted">/</span>
                  <span className="text-status-error">{token.txns?.h24?.sells || 0} sells</span>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <a
                    href={token.url || `https://dexscreener.com/monad/${token.pairAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                    title="View on DEXScreener"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href={getExplorerUrl('token', token.baseToken.address)}
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
