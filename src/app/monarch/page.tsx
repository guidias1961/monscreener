'use client'

import { useState, useCallback } from 'react'
import { Wallet, Search, ArrowRightLeft, History, Coins, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react'
import { useAccount } from 'wagmi'
import { WalletInfo, TokenTransfer, Transaction } from '@/types'
import { WalletSearch } from '@/components/wallet/WalletSearch'
import { WalletOverview } from '@/components/wallet/WalletOverview'
import { StatsCard, StatsGrid } from '@/components/stats/StatsCard'
import { TokenLogo } from '@/components/ui/TokenLogo'
import { getWalletInfo, getTokenTransfers } from '@/lib/api/monad-rpc'
import { formatNumber, formatTimeAgo, truncateAddress, copyToClipboard, parseTokenAmount, cn } from '@/lib/utils'
import { getExplorerUrl } from '@/lib/wagmi'

export default function MonArchPage() {
  const { address: connectedAddress, isConnected } = useAccount()
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [transfers, setTransfers] = useState<TokenTransfer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTransfers, setLoadingTransfers] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchedAddress, setSearchedAddress] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'transfers' | 'history'>('overview')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [transfersFetched, setTransfersFetched] = useState(false)
  const [historyFetched, setHistoryFetched] = useState(false)

  const handleSearch = useCallback(async (address: string) => {
    setLoading(true)
    setError(null)
    setSearchedAddress(address)
    setTransfersFetched(false)
    setHistoryFetched(false)
    setTransfers([])
    setTransactions([])

    try {
      // Fetch wallet info (fast - only balance and tx count)
      const info = await getWalletInfo(address)
      setWalletInfo(info)
    } catch (err) {
      console.error('Error fetching wallet data:', err)
      setError('Failed to fetch wallet data. Please check the address and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch token transfers on demand
  const fetchTransfers = useCallback(async () => {
    if (loadingTransfers || transfersFetched || !searchedAddress) return

    setLoadingTransfers(true)
    try {
      // Pass 0 as fromBlock to let getTokenTransfers scan up to 50,000 blocks
      const recentTransfers = await getTokenTransfers(searchedAddress, 0, 'latest')
      setTransfers(recentTransfers)
      setTransfersFetched(true)
    } catch (err) {
      console.error('Error fetching transfers:', err)
    } finally {
      setLoadingTransfers(false)
    }
  }, [searchedAddress, loadingTransfers, transfersFetched])

  // Fetch transaction history on demand - uses token transfers as primary source
  const fetchHistory = useCallback(async () => {
    if (loadingHistory || historyFetched || !searchedAddress) return

    setLoadingHistory(true)
    try {
      // Fetch token transfers as the primary history source (more reliable than block scanning)
      // Pass 0 as fromBlock to let getTokenTransfers scan up to 50,000 blocks (~14 hours)
      const recentTransfers = await getTokenTransfers(searchedAddress, 0, 'latest')

      // Convert token transfers to transaction format for display
      const txsFromTransfers: Transaction[] = recentTransfers.map(transfer => ({
        hash: transfer.transactionHash || '0x',
        blockNumber: transfer.blockNumber || 0,
        timestamp: Date.now(), // We don't have timestamp from transfers
        from: transfer.from,
        to: transfer.to,
        value: transfer.value,
        gasUsed: '0x0',
        gasPrice: '0x0',
        status: 'success' as const,
        type: 'transfer' as const,
        tokenTransfers: [transfer]
      }))

      // Dedupe by transaction hash
      const seen = new Set<string>()
      const uniqueTxs = txsFromTransfers.filter(tx => {
        if (!tx.hash || tx.hash === '0x' || seen.has(tx.hash)) return false
        seen.add(tx.hash)
        return true
      })

      setTransactions(uniqueTxs)
      setHistoryFetched(true)
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [searchedAddress, loadingHistory, historyFetched])

  const handleCopy = async (address: string) => {
    const success = await copyToClipboard(address)
    if (success) {
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    }
  }

  // Use connected wallet if available
  const handleUseConnectedWallet = () => {
    if (connectedAddress) {
      handleSearch(connectedAddress)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'history', label: 'History', icon: History },
  ] as const

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-monad">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">MonArch</h1>
            <p className="text-sm text-text-muted">
              Wallet analytics for Monad
            </p>
          </div>
        </div>

        {isConnected && !walletInfo && (
          <button
            onClick={handleUseConnectedWallet}
            className="btn-primary flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            Analyze My Wallet
          </button>
        )}
      </div>

      {!walletInfo && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Component */}
          <WalletSearch onSearch={handleSearch} isLoading={loading} />

          {/* Info Card */}
          <div className="card-base p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">What is MonArch?</h2>
            <p className="text-sm text-text-muted">
              MonArch is your comprehensive wallet analytics tool for the Monad blockchain.
              Enter any wallet address to view:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <Coins className="h-4 w-4 text-monad-purple" />
                Token holdings and balances
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <ArrowRightLeft className="h-4 w-4 text-monad-purple" />
                Token transfers and swaps
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <History className="h-4 w-4 text-monad-purple" />
                Transaction history
              </li>
            </ul>

            <div className="pt-4 border-t border-dark-border">
              <h3 className="text-sm font-medium text-white mb-2">Network Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Network:</span>
                  <span className="ml-2 text-white">Monad Mainnet</span>
                </div>
                <div>
                  <span className="text-text-muted">Chain ID:</span>
                  <span className="ml-2 text-white">143</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card-base p-4 border-status-error/50 bg-status-error-bg">
          <p className="text-status-error">{error}</p>
          <button
            onClick={() => handleSearch(searchedAddress)}
            className="mt-2 text-sm text-monad-purple hover:text-monad-purple-light"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="card-base p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-dark-bg-tertiary" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-dark-bg-tertiary rounded" />
                <div className="h-4 w-96 bg-dark-bg-tertiary rounded" />
              </div>
            </div>
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
      )}

      {/* Wallet Data */}
      {walletInfo && !loading && (
        <div className="space-y-6">
          {/* New Search */}
          <div className="card-base p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search another wallet address..."
                  defaultValue={searchedAddress}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch((e.target as HTMLInputElement).value)
                    }
                  }}
                  className="input-base pl-10 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => handleSearch(searchedAddress)}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-dark-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  // Fetch data on tab click
                  if (tab.id === 'transfers' && !transfersFetched) {
                    fetchTransfers()
                  } else if (tab.id === 'history' && !historyFetched) {
                    fetchHistory()
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-monad-purple text-monad-purple'
                    : 'border-transparent text-text-secondary hover:text-white'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'transfers' && loadingTransfers && (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                )}
                {tab.id === 'history' && loadingHistory && (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <WalletOverview wallet={walletInfo} />
          )}

          {activeTab === 'transfers' && (
            <div className="card-base">
              <div className="p-4 border-b border-dark-border flex items-center justify-between">
                <h2 className="font-semibold text-white">Recent Token Transfers</h2>
                <button
                  onClick={fetchTransfers}
                  disabled={loadingTransfers}
                  className="text-sm text-monad-purple hover:text-monad-purple-light flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingTransfers ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              {loadingTransfers ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 mx-auto text-monad-purple mb-4 animate-spin" />
                  <p className="text-text-muted">Loading token transfers...</p>
                  <p className="text-xs text-text-muted mt-2">Scanning recent blocks for ERC20 transfers</p>
                </div>
              ) : transfers.length === 0 ? (
                <div className="p-8 text-center">
                  <ArrowRightLeft className="h-12 w-12 mx-auto text-text-muted mb-4" />
                  <p className="text-text-muted">No recent transfers found</p>
                  <p className="text-xs text-text-muted mt-2">Token transfers from the last ~14 hours will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th>Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.slice(0, 50).map((transfer, i) => {
                        const isIncoming = transfer.to.toLowerCase() === searchedAddress.toLowerCase()
                        return (
                          <tr key={i} className="table-row">
                            <td>
                              <div className="flex items-center gap-2">
                                <TokenLogo src={transfer.logo} symbol={transfer.symbol} size="sm" />
                                <span className="font-medium text-white">{transfer.symbol}</span>
                              </div>
                            </td>
                            <td>
                              <span className={cn(
                                'badge',
                                isIncoming ? 'bg-status-success-bg text-status-success' : 'bg-status-error-bg text-status-error'
                              )}>
                                {isIncoming ? 'IN' : 'OUT'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-text-secondary">
                                  {truncateAddress(transfer.from)}
                                </span>
                                <button
                                  onClick={() => handleCopy(transfer.from)}
                                  className="text-text-muted hover:text-monad-purple"
                                >
                                  {copiedAddress === transfer.from ? (
                                    <Check className="h-3 w-3 text-status-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-text-secondary">
                                  {truncateAddress(transfer.to)}
                                </span>
                                <button
                                  onClick={() => handleCopy(transfer.to)}
                                  className="text-text-muted hover:text-monad-purple"
                                >
                                  {copiedAddress === transfer.to ? (
                                    <Check className="h-3 w-3 text-status-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="font-mono text-sm">
                              {formatNumber(parseTokenAmount(BigInt(transfer.value || '0'), transfer.decimals))}
                            </td>
                            <td>
                              <a
                                href={getExplorerUrl('token', transfer.token)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card-base">
              <div className="p-4 border-b border-dark-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">Transaction History</h2>
                  <p className="text-xs text-text-muted mt-0.5">Token transfers from last ~14 hours</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setHistoryFetched(false); fetchHistory(); }}
                    disabled={loadingHistory}
                    className="text-sm text-monad-purple hover:text-monad-purple-light flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <a
                    href={getExplorerUrl('address', searchedAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-monad-purple hover:text-monad-purple-light flex items-center gap-1"
                  >
                    Full History <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              {loadingHistory ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 mx-auto text-monad-purple mb-4 animate-spin" />
                  <p className="text-text-muted">Loading transaction history...</p>
                  <p className="text-xs text-text-muted mt-2">Scanning ERC20 Transfer events...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <History className="h-12 w-12 mx-auto text-text-muted mb-4" />
                  <p className="text-text-muted">No token transfers found in recent blocks</p>
                  <p className="text-xs text-text-muted mt-2">
                    For full transaction history including native MON transfers, use the{' '}
                    <a
                      href={getExplorerUrl('address', searchedAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-monad-purple hover:text-monad-purple-light"
                    >
                      block explorer
                    </a>
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Hash</th>
                        <th>Token</th>
                        <th>Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                        <th>Block</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 50).map((tx) => {
                        const isIncoming = tx.to.toLowerCase() === searchedAddress.toLowerCase()
                        const tokenTransfer = tx.tokenTransfers?.[0]
                        const amount = tokenTransfer
                          ? parseTokenAmount(BigInt(tokenTransfer.value || '0'), tokenTransfer.decimals)
                          : parseInt(tx.value, 16) / 1e18
                        const symbol = tokenTransfer?.symbol || 'MON'
                        return (
                          <tr key={tx.hash} className="table-row">
                            <td>
                              <span className="font-mono text-xs text-text-secondary">
                                {truncateAddress(tx.hash)}
                              </span>
                            </td>
                            <td>
                              {tokenTransfer ? (
                                <div className="flex items-center gap-2">
                                  <TokenLogo src={tokenTransfer.logo} symbol={tokenTransfer.symbol} size="sm" />
                                  <span className="text-sm text-white">{tokenTransfer.symbol}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-text-muted">MON</span>
                              )}
                            </td>
                            <td>
                              <span className={cn(
                                'badge',
                                isIncoming ? 'bg-status-success-bg text-status-success' : 'bg-status-error-bg text-status-error'
                              )}>
                                {isIncoming ? 'IN' : 'OUT'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-text-secondary">
                                  {truncateAddress(tx.from)}
                                </span>
                                <button
                                  onClick={() => handleCopy(tx.from)}
                                  className="text-text-muted hover:text-monad-purple"
                                >
                                  {copiedAddress === tx.from ? (
                                    <Check className="h-3 w-3 text-status-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs text-text-secondary">
                                  {tx.to ? truncateAddress(tx.to) : 'Contract Creation'}
                                </span>
                                {tx.to && (
                                  <button
                                    onClick={() => handleCopy(tx.to)}
                                    className="text-text-muted hover:text-monad-purple"
                                  >
                                    {copiedAddress === tx.to ? (
                                      <Check className="h-3 w-3 text-status-success" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="font-mono text-sm">
                              {amount > 0 ? `${formatNumber(amount)} ${symbol}` : '-'}
                            </td>
                            <td className="font-mono text-xs text-text-muted">
                              #{formatNumber(tx.blockNumber)}
                            </td>
                            <td>
                              <a
                                href={getExplorerUrl('tx', tx.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-dark-bg-tertiary text-text-muted hover:text-monad-purple transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
