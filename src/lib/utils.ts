import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format large numbers with K, M, B suffixes
export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '-'
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '-'

  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  if (n >= 1) return n.toFixed(2)
  if (n >= 0.0001) return n.toFixed(4)
  if (n > 0) return n.toExponential(2)
  return '0'
}

// Format currency with $ prefix
export function formatCurrency(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '-'
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '-'
  return `$${formatNumber(n)}`
}

// Format percentage
export function formatPercent(num: number | string | undefined | null, includeSign = true): string {
  if (num === undefined || num === null) return '-'
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '-'

  const formatted = Math.abs(n).toFixed(2)
  if (includeSign && n > 0) return `+${formatted}%`
  if (n < 0) return `-${formatted}%`
  return `${formatted}%`
}

// Truncate address for display
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

// Format timestamp to relative time
export function formatTimeAgo(timestamp: number | string | Date): string {
  const now = Date.now()
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
  const diff = now - time

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Debounce function
export function debounce<T extends (...args: string[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Parse token amount from wei
export function parseTokenAmount(amount: bigint | string, decimals = 18): number {
  const value = typeof amount === 'string' ? BigInt(amount) : amount
  return Number(value) / Math.pow(10, decimals)
}

// Format token amount to wei
export function formatTokenAmount(amount: number, decimals = 18): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)))
}

// Get price change class
export function getPriceChangeClass(change: number | undefined | null): string {
  if (change === undefined || change === null) return ''
  if (change > 0) return 'price-up'
  if (change < 0) return 'price-down'
  return ''
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, i))
      }
    }
  }
  throw lastError!
}
