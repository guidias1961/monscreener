'use client'

import { useState, useEffect } from 'react'
import { Activity, Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { getBlockNumber, getGasPrice } from '@/lib/api/monad-rpc'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'block' | 'gas' | 'info'
  title: string
  description: string
  timestamp: Date
  icon: 'up' | 'down' | 'neutral'
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const [gasPrice, setGasPrice] = useState<string>('0')
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [block, gas] = await Promise.all([
        getBlockNumber(),
        getGasPrice()
      ])

      setBlockNumber(block)
      setGasPrice(gas)

      // Generate activity items
      const newActivities: ActivityItem[] = [
        {
          id: `block-${block}`,
          type: 'block',
          title: 'New Block',
          description: `Block #${block.toLocaleString()} mined`,
          timestamp: new Date(),
          icon: 'up'
        },
        {
          id: `gas-${Date.now()}`,
          type: 'gas',
          title: 'Gas Price Update',
          description: `Current gas: ${(parseInt(gas, 16) / 1e9).toFixed(2)} Gwei`,
          timestamp: new Date(),
          icon: 'neutral'
        }
      ]

      setActivities(prev => [...newActivities, ...prev].slice(0, 50))
    } catch (error) {
      console.error('Failed to fetch activity data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-monad">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Network Activity</h1>
            <p className="text-sm text-text-muted">
              Real-time Monad blockchain activity
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base p-4">
          <div className="text-sm text-text-muted">Current Block</div>
          <div className="text-2xl font-bold text-white mt-1">
            {loading ? '...' : `#${blockNumber.toLocaleString()}`}
          </div>
        </div>
        <div className="card-base p-4">
          <div className="text-sm text-text-muted">Gas Price</div>
          <div className="text-2xl font-bold text-white mt-1">
            {loading ? '...' : `${(parseInt(gasPrice, 16) / 1e9).toFixed(2)} Gwei`}
          </div>
        </div>
        <div className="card-base p-4">
          <div className="text-sm text-text-muted">Network</div>
          <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
            </span>
            Monad Mainnet
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="font-semibold text-white">Recent Activity</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No activity yet
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-dark-bg-secondary transition-colors">
                <div className={`p-2 rounded-lg ${
                  activity.icon === 'up' ? 'bg-status-success/10 text-status-success' :
                  activity.icon === 'down' ? 'bg-status-error/10 text-status-error' :
                  'bg-monad-purple/10 text-monad-purple'
                }`}>
                  {activity.icon === 'up' ? <ArrowUpRight className="h-4 w-4" /> :
                   activity.icon === 'down' ? <ArrowDownRight className="h-4 w-4" /> :
                   <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{activity.title}</div>
                  <div className="text-sm text-text-muted truncate">{activity.description}</div>
                </div>
                <div className="text-xs text-text-muted">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
