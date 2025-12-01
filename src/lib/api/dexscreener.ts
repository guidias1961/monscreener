import { DexScreenerToken, DexScreenerSearchResponse } from '@/types'
import { retryWithBackoff } from '@/lib/utils'

const BASE_URL = 'https://api.dexscreener.com'
const RATE_LIMIT_DELAY = 200 // ms between requests (300 req/min = 5 req/sec)

let lastRequestTime = 0

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest))
  }

  lastRequestTime = Date.now()
  return fetch(url)
}

// Search for tokens on Monad
export async function searchMonadTokens(query: string): Promise<DexScreenerToken[]> {
  return retryWithBackoff(async () => {
    const response = await rateLimitedFetch(
      `${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`)
    }

    const data: DexScreenerSearchResponse = await response.json()

    // Filter only Monad chain results
    return data.pairs?.filter(pair => pair.chainId === 'monad') || []
  })
}

// Get token pairs by address
export async function getTokenPairs(tokenAddress: string): Promise<DexScreenerToken[]> {
  return retryWithBackoff(async () => {
    const response = await rateLimitedFetch(
      `${BASE_URL}/token-pairs/v1/monad/${tokenAddress}`
    )

    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`)
    }

    const data = await response.json()
    return data.pairs || data || []
  })
}

// Get multiple tokens by addresses (up to 30)
export async function getTokensByAddresses(addresses: string[]): Promise<DexScreenerToken[]> {
  if (addresses.length === 0) return []

  // DEXScreener supports up to 30 addresses
  const chunks: string[][] = []
  for (let i = 0; i < addresses.length; i += 30) {
    chunks.push(addresses.slice(i, i + 30))
  }

  const results: DexScreenerToken[] = []

  for (const chunk of chunks) {
    const tokens = await retryWithBackoff(async () => {
      const response = await rateLimitedFetch(
        `${BASE_URL}/tokens/v1/monad/${chunk.join(',')}`
      )

      if (!response.ok) {
        throw new Error(`DEXScreener API error: ${response.status}`)
      }

      const data = await response.json()
      return data.pairs || data || []
    })

    results.push(...tokens)
  }

  return results
}

// Get latest token profiles
export async function getLatestTokenProfiles(): Promise<DexScreenerToken[]> {
  return retryWithBackoff(async () => {
    const response = await rateLimitedFetch(`${BASE_URL}/token-profiles/latest/v1`)

    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`)
    }

    const data = await response.json()
    // Filter for Monad tokens
    return (data || []).filter((token: DexScreenerToken) => token.chainId === 'monad')
  })
}

// Get boosted tokens
export async function getBoostedTokens(): Promise<DexScreenerToken[]> {
  return retryWithBackoff(async () => {
    const response = await rateLimitedFetch(`${BASE_URL}/token-boosts/latest/v1`)

    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`)
    }

    const data = await response.json()
    // Filter for Monad tokens
    return (data || []).filter((token: DexScreenerToken) => token.chainId === 'monad')
  })
}

// Get top boosted tokens
export async function getTopBoostedTokens(): Promise<DexScreenerToken[]> {
  return retryWithBackoff(async () => {
    const response = await rateLimitedFetch(`${BASE_URL}/token-boosts/top/v1`)

    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`)
    }

    const data = await response.json()
    // Filter for Monad tokens
    return (data || []).filter((token: DexScreenerToken) => token.chainId === 'monad')
  })
}

// Get pair by chain and pair address
export async function getPairByAddress(pairAddress: string): Promise<DexScreenerToken | null> {
  return retryWithBackoff(async () => {
    const response = await rateLimitedFetch(
      `${BASE_URL}/latest/dex/pairs/monad/${pairAddress}`
    )

    if (!response.ok) {
      throw new Error(`DEXScreener API error: ${response.status}`)
    }

    const data = await response.json()
    return data.pairs?.[0] || data.pair || null
  })
}

// Get all Monad tokens (combines multiple endpoints)
export async function getAllMonadTokens(): Promise<DexScreenerToken[]> {
  try {
    // Search for common trading pairs on Monad
    const searchQueries = ['MON', 'WMON', 'USDC', 'USDT', 'ETH', 'meme']
    const allTokens: DexScreenerToken[] = []
    const seenPairs = new Set<string>()

    for (const query of searchQueries) {
      try {
        const tokens = await searchMonadTokens(query)
        for (const token of tokens) {
          if (!seenPairs.has(token.pairAddress)) {
            seenPairs.add(token.pairAddress)
            allTokens.push(token)
          }
        }
      } catch (error) {
        console.error(`Error searching for ${query}:`, error)
      }
    }

    // Also try to get boosted tokens
    try {
      const boosted = await getBoostedTokens()
      for (const token of boosted) {
        if (!seenPairs.has(token.pairAddress)) {
          seenPairs.add(token.pairAddress)
          allTokens.push(token)
        }
      }
    } catch (error) {
      console.error('Error fetching boosted tokens:', error)
    }

    // Sort by 24h volume
    return allTokens.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
  } catch (error) {
    console.error('Error fetching all Monad tokens:', error)
    return []
  }
}
