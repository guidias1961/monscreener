'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface TokenLogoProps {
  src?: string | null
  symbol: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56
}

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl'
}

export function TokenLogo({ src, symbol, size = 'md', className }: TokenLogoProps) {
  const [error, setError] = useState(false)
  const dimension = sizeMap[size]

  // Generate consistent color based on symbol
  const getColorFromSymbol = (s: string) => {
    const colors = [
      'bg-purple-500/20 text-purple-400',
      'bg-blue-500/20 text-blue-400',
      'bg-green-500/20 text-green-400',
      'bg-yellow-500/20 text-yellow-400',
      'bg-red-500/20 text-red-400',
      'bg-pink-500/20 text-pink-400',
      'bg-cyan-500/20 text-cyan-400',
      'bg-orange-500/20 text-orange-400',
    ]
    const index = s.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  if (!src || error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-semibold',
          getColorFromSymbol(symbol),
          textSizeMap[size],
          className
        )}
        style={{ width: dimension, height: dimension }}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <div
      className={cn('relative rounded-full overflow-hidden bg-dark-bg-tertiary', className)}
      style={{ width: dimension, height: dimension }}
    >
      <Image
        src={src}
        alt={symbol}
        width={dimension}
        height={dimension}
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}
