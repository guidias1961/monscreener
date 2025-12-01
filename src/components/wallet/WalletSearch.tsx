'use client'

import { useState, FormEvent } from 'react'
import { Search, Wallet, AlertCircle } from 'lucide-react'
import { cn, isValidAddress } from '@/lib/utils'

interface WalletSearchProps {
  onSearch: (address: string) => void
  isLoading?: boolean
}

export function WalletSearch({ onSearch, isLoading }: WalletSearchProps) {
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedAddress = address.trim()

    if (!trimmedAddress) {
      setError('Please enter a wallet address')
      return
    }

    if (!isValidAddress(trimmedAddress)) {
      setError('Invalid Ethereum address format')
      return
    }

    onSearch(trimmedAddress)
  }

  return (
    <div className="card-base p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-monad-purple/10">
          <Wallet className="h-5 w-5 text-monad-purple" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Wallet Analytics</h2>
          <p className="text-sm text-text-muted">Enter a wallet address to view analytics</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setError('')
              }}
              placeholder="Enter wallet address (0x...)"
              className={cn(
                'input-base pl-12 pr-4 py-3 font-mono text-sm',
                error && 'border-status-error focus:border-status-error focus:ring-status-error/20'
              )}
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-status-error text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Fetching wallet data...
            </span>
          ) : (
            'Analyze Wallet'
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-dark-border">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Quick Links</h3>
        <div className="grid grid-cols-2 gap-2">
          <a
            href="https://monadvision.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-center text-sm"
          >
            MonadVision
          </a>
          <a
            href="https://monadscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-center text-sm"
          >
            Monadscan
          </a>
        </div>
      </div>
    </div>
  )
}
