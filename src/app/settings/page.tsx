'use client'

import { useState } from 'react'
import { Settings, Moon, Sun, Bell, Shield, Wallet, ExternalLink } from 'lucide-react'
import { useAccount, useDisconnect } from 'wagmi'
import { EXPLORERS, getExplorerUrl } from '@/lib/wagmi'

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [notifications, setNotifications] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-monad">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-text-muted">
            Configure your MonScreener experience
          </p>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-monad-purple" />
            <h2 className="font-semibold text-white">Wallet</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {isConnected && address ? (
            <>
              <div>
                <label className="text-sm text-text-muted">Connected Address</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-dark-bg-tertiary rounded-lg text-sm text-white font-mono">
                    {address}
                  </code>
                  <a
                    href={getExplorerUrl('address', address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-dark-bg-tertiary hover:bg-dark-border transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-text-muted" />
                  </a>
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="btn-secondary text-status-error hover:bg-status-error/10"
              >
                Disconnect Wallet
              </button>
            </>
          ) : (
            <p className="text-text-muted">No wallet connected. Use the Connect button in the header.</p>
          )}
        </div>
      </div>

      {/* Display Section */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-monad-purple" />
            <h2 className="font-semibold text-white">Display</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Theme</div>
              <div className="text-sm text-text-muted">Dark mode is always enabled for optimal viewing</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-bg-tertiary">
              <Moon className="h-4 w-4 text-monad-purple" />
              <span className="text-sm text-white">Dark</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Auto Refresh</div>
              <div className="text-sm text-text-muted">Automatically refresh data every 30 seconds</div>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoRefresh ? 'bg-monad-purple' : 'bg-dark-bg-tertiary'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                autoRefresh ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-monad-purple" />
            <h2 className="font-semibold text-white">Notifications</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Price Alerts</div>
              <div className="text-sm text-text-muted">Get notified when tokens hit your target price</div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notifications ? 'bg-monad-purple' : 'bg-dark-bg-tertiary'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                notifications ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Network Section */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-monad-purple" />
            <h2 className="font-semibold text-white">Network</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-text-muted">Current Network</label>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-dark-bg-tertiary rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
              </span>
              <span className="text-white">Monad Mainnet</span>
              <span className="text-text-muted">(Chain ID: 143)</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted">Block Explorers</label>
            <div className="mt-1 space-y-2">
              {Object.entries(EXPLORERS).map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 bg-dark-bg-tertiary rounded-lg hover:bg-dark-border transition-colors"
                >
                  <span className="text-white capitalize">{name}</span>
                  <ExternalLink className="h-4 w-4 text-text-muted" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
