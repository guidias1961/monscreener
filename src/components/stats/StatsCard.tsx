'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon?: ReactNode
  className?: string
  subtitle?: string
}

export function StatsCard({ title, value, change, icon, className, subtitle }: StatsCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <div className={cn('card-base card-hover p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-monad-purple/10 text-monad-purple">
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-status-success" />
          ) : isNegative ? (
            <TrendingDown className="h-3 w-3 text-status-error" />
          ) : null}
          <span
            className={cn(
              'text-xs font-medium',
              isPositive && 'text-status-success',
              isNegative && 'text-status-error',
              !isPositive && !isNegative && 'text-text-muted'
            )}
          >
            {isPositive && '+'}
            {change.toFixed(2)}%
          </span>
          <span className="text-xs text-text-muted ml-1">vs 24h</span>
        </div>
      )}
    </div>
  )
}

interface StatsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  )
}
