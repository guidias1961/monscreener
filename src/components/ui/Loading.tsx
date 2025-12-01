'use client'

import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function Loading({ className, size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-monad-purple border-t-transparent',
          sizeClasses[size]
        )}
      />
      {text && <p className="text-sm text-text-muted">{text}</p>}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-dark-bg-tertiary/50">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-3 w-1/3" />
          </div>
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card-base p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="skeleton h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-1/3" />
          <div className="skeleton h-4 w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="flex gap-4">
        <div className="skeleton h-8 w-24" />
        <div className="skeleton h-8 w-24" />
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-base p-4 space-y-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-6 w-3/4" />
        </div>
      ))}
    </div>
  )
}
