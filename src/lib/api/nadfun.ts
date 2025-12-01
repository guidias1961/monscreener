import { NadFunToken, NadFunOrderResponse, NadFunTokenMarket, NadFunHolder, NadFunSwap } from '@/types'
import { getNextRpcUrl } from '@/lib/wagmi'

// DEXScreener API
const DEXSCREENER_API = 'https://api.dexscreener.com'

// nad.fun Mainnet Contract Addresses (from contract-v3-abi)
const NAD_CONTRACTS = {
  BONDING_CURVE: '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE',
  BONDING_CURVE_ROUTER: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22',
  LENS: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea',
  DEX_ROUTER: '0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137',
  DEX_FACTORY: '0x6B5F564339DbAD6b780249827f2198a841FEB7F3',
  WMON: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A'
}

// Event signatures (keccak256 hashes)
// CurveCreate(address indexed creator, address indexed token, address indexed pool, string name, string symbol, string tokenURI, uint256 virtualMon, uint256 virtualToken, uint256 targetTokenAmount)
// keccak256("CurveCreate(address,address,address,string,string,string,uint256,uint256,uint256)")
const CURVE_CREATE_TOPIC = '0xd37e3f4f651fe74251701614dbeac478f5a0d29068e87bbe44e5026d166abca9'

// Function selectors for LENS contract
const IS_GRADUATED_SELECTOR = '0x68a4c8b7' // isGraduated(address)
const GET_PROGRESS_SELECTOR = '0xaef76501' // getProgress(address)

// Simple RPC call
async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const url = getNextRpcUrl()
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  })

  if (!response.ok) throw new Error(`RPC error: ${response.status}`)
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.result
}

// DexPair type for DEXScreener API responses
interface DexPair {
  chainId: string
  dexId?: string
  baseToken: { address: string; name: string; symbol: string }
  quoteToken?: { address: string; name: string; symbol: string }
  info?: { imageUrl?: string; websites?: { url: string }[]; socials?: { type: string; url: string }[] }
  pairCreatedAt?: number
  marketCap?: number
  fdv?: number
  priceUsd?: string
  priceChange?: { h24?: number }
  volume?: { h24?: number }
  liquidity?: { usd?: number }
}

// Convert DEXScreener pair to NadFunToken
function pairToToken(pair: DexPair): NadFunToken {
  return {
    token: pair.baseToken.address,
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    description: undefined,
    image: pair.info?.imageUrl,
    twitter: pair.info?.socials?.find((s: { type: string }) => s.type === 'twitter')?.url,
    telegram: pair.info?.socials?.find((s: { type: string }) => s.type === 'telegram')?.url,
    website: pair.info?.websites?.[0]?.url,
    creator: '',
    createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : new Date().toISOString(),
    marketCap: pair.marketCap || pair.fdv || 0,
    price: parseFloat(pair.priceUsd || '0'),
    priceChange24h: pair.priceChange?.h24 || 0,
    volume24h: pair.volume?.h24 || 0,
    holders: 0,
    totalSupply: undefined,
    graduated: pair.dexId !== 'nad-fun' || (pair.liquidity?.usd || 0) > 10000,
    bondingCurveProgress: pair.dexId === 'nad-fun' ? 100 : Math.min((pair.liquidity?.usd || 0) / 100, 100)
  }
}

// Fetch Monad tokens from DEXScreener token-boosts endpoint
async function fetchFromTokenBoosts(): Promise<NadFunToken[]> {
  try {
    const response = await fetch(`${DEXSCREENER_API}/token-boosts/top/v1`, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) return []

    const data = await response.json()
    const monadTokens = data.filter((t: { chainId: string }) => t.chainId === 'monad')

    // Get full token data for each Monad token
    const tokens: NadFunToken[] = []
    for (const token of monadTokens.slice(0, 50)) {
      try {
        const detailRes = await fetch(`${DEXSCREENER_API}/tokens/v1/monad/${token.tokenAddress}`)
        if (detailRes.ok) {
          const pairs = await detailRes.json()
          if (pairs && pairs.length > 0) {
            tokens.push(pairToToken(pairs[0]))
          }
        }
      } catch {
        // Skip failed tokens
      }
    }

    return tokens
  } catch (error) {
    console.error('Failed to fetch from token boosts:', error)
    return []
  }
}

// Fetch tokens from DEXScreener search
async function fetchFromDexScreener(): Promise<NadFunToken[]> {
  try {
    // Try multiple search queries to find Monad tokens
    const searches = ['monad', 'nad.fun', 'MON', 'WMON']
    const allPairs: DexPair[] = []

    for (const query of searches) {
      try {
        const response = await fetch(`${DEXSCREENER_API}/latest/dex/search?q=${encodeURIComponent(query)}`, {
          headers: { 'Accept': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          const pairs = data.pairs || []
          // Filter for Monad chain
          const monadPairs = pairs.filter((p: DexPair) => p.chainId === 'monad')
          allPairs.push(...monadPairs)
        }
      } catch {
        // Continue with next search
      }
    }

    // Deduplicate by token address
    const seen = new Set<string>()
    const uniquePairs = allPairs.filter(p => {
      const key = p.baseToken.address.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return uniquePairs.map(pairToToken)
  } catch (error) {
    console.error('Failed to fetch from DEXScreener:', error)
    return []
  }
}

// Fetch token info from LENS contract
async function getTokenFromLens(tokenAddress: string): Promise<{ graduated: boolean; progress: number; price: number } | null> {
  try {
    const paddedAddr = tokenAddress.slice(2).padStart(64, '0')

    // isGraduated(address _token) -> bool
    const graduatedData = IS_GRADUATED_SELECTOR + paddedAddr
    const graduatedResult = await rpcCall('eth_call', [
      { to: NAD_CONTRACTS.LENS, data: graduatedData },
      'latest'
    ]) as string

    const graduated = graduatedResult !== '0x' &&
      graduatedResult !== '0x0000000000000000000000000000000000000000000000000000000000000000'

    // getProgress(address _token) -> uint256
    const progressData = GET_PROGRESS_SELECTOR + paddedAddr
    const progressResult = await rpcCall('eth_call', [
      { to: NAD_CONTRACTS.LENS, data: progressData },
      'latest'
    ]) as string

    // Progress is returned as a uint256 (0-10000 for 0-100%)
    const progress = progressResult && progressResult !== '0x'
      ? parseInt(progressResult, 16) / 100
      : 0

    // For price, we would need getAmountOut but let's skip for now
    // Price can be estimated from progress or fetched from DEXScreener later
    const price = 0

    return { graduated, progress: Math.min(progress, 100), price }
  } catch (error) {
    console.log(`LENS call failed for ${tokenAddress}:`, error)
    return null
  }
}

// Get curve data from BondingCurve contract
async function getCurveData(tokenAddress: string): Promise<{ virtualMon: bigint; virtualToken: bigint } | null> {
  try {
    const paddedAddr = tokenAddress.slice(2).padStart(64, '0')
    // curves(address token) -> (uint256 virtualMon, uint256 virtualToken, uint256 k, ...)
    const curveData = '0x' + 'f3de0c41' + paddedAddr
    const result = await rpcCall('eth_call', [
      { to: NAD_CONTRACTS.BONDING_CURVE, data: curveData },
      'latest'
    ]) as string

    if (result && result.length > 130) {
      const virtualMon = BigInt('0x' + result.slice(2, 66))
      const virtualToken = BigInt('0x' + result.slice(66, 130))
      return { virtualMon, virtualToken }
    }
    return null
  } catch {
    return null
  }
}

// Fetch tokens from bonding curve CurveCreate events
async function fetchFromBondingCurve(): Promise<NadFunToken[]> {
  try {
    // Get current block number
    const blockNumberHex = await rpcCall('eth_blockNumber', []) as string
    const currentBlock = parseInt(blockNumberHex, 16)

    console.log(`Querying CurveCreate events (current block: ${currentBlock})`)

    // RPC limits eth_getLogs to 100 blocks per query
    // Query in batches of 100 blocks
    // 24 hours on Monad (~500ms block time) = ~172,800 blocks
    // We'll query 20,000 blocks (about 2.7 hours) to balance speed and coverage
    const BATCH_SIZE = 100
    const NUM_BATCHES = 200 // 20,000 blocks total (~2.7 hours)

    const allLogs: Array<{
      topics: string[]
      data: string
      blockNumber: string
      transactionHash: string
    }> = []

    // Query in parallel batches of 10 to speed up
    for (let batchGroup = 0; batchGroup < NUM_BATCHES; batchGroup += 10) {
      const batchPromises = []

      for (let i = 0; i < 10 && (batchGroup + i) < NUM_BATCHES; i++) {
        const batchIndex = batchGroup + i
        const toBlock = currentBlock - (batchIndex * BATCH_SIZE)
        const fromBlock = toBlock - BATCH_SIZE + 1

        if (fromBlock < 0) continue

        batchPromises.push(
          rpcCall('eth_getLogs', [{
            fromBlock: `0x${fromBlock.toString(16)}`,
            toBlock: `0x${toBlock.toString(16)}`,
            address: NAD_CONTRACTS.BONDING_CURVE,
            topics: [CURVE_CREATE_TOPIC]
          }]).catch(() => [])
        )
      }

      const batchResults = await Promise.all(batchPromises)
      for (const result of batchResults) {
        if (Array.isArray(result)) {
          allLogs.push(...result)
        }
      }
    }

    console.log(`Got ${allLogs.length} CurveCreate events from BondingCurve contract`)

    // Parse token addresses from CurveCreate events
    // In CurveCreate: topics[0] = event sig, topics[1] = creator, topics[2] = token, topics[3] = pool
    const tokenAddresses = new Set<string>()
    const tokenCreators = new Map<string, string>()
    const tokenBlockNumbers = new Map<string, number>()

    for (const log of allLogs) {
      // Token address is in topics[2] (the indexed `token` parameter)
      if (log.topics && log.topics.length >= 3) {
        const tokenTopic = log.topics[2]
        if (tokenTopic && tokenTopic.length === 66) {
          const tokenAddr = '0x' + tokenTopic.slice(26).toLowerCase()
          if (tokenAddr.length === 42) {
            tokenAddresses.add(tokenAddr)

            // Store creator address from topics[1]
            if (log.topics[1]) {
              const creatorAddr = '0x' + log.topics[1].slice(26).toLowerCase()
              tokenCreators.set(tokenAddr, creatorAddr)
            }

            // Store block number for creation time
            const blockNum = parseInt(log.blockNumber, 16)
            tokenBlockNumbers.set(tokenAddr, blockNum)
          }
        }
      }
    }

    console.log(`Found ${tokenAddresses.size} unique tokens from CurveCreate events`)

    // For each token, get basic info and LENS data
    const tokens: NadFunToken[] = []
    const addressList = Array.from(tokenAddresses).slice(0, 200) // Get up to 200 tokens

    // Process tokens in batches
    const batchSize = 10
    for (let i = 0; i < addressList.length; i += batchSize) {
      const batch = addressList.slice(i, i + batchSize)

      const batchResults = await Promise.all(
        batch.map(async (addr) => {
          try {
            // First check if this is a valid token on the bonding curve
            const lensData = await getTokenFromLens(addr)

            // Get token metadata using ERC20 calls
            const [nameResult, symbolResult] = await Promise.all([
              rpcCall('eth_call', [{ to: addr, data: '0x06fdde03' }, 'latest']).catch(() => '0x'),
              rpcCall('eth_call', [{ to: addr, data: '0x95d89b41' }, 'latest']).catch(() => '0x')
            ])

            const name = decodeString(nameResult as string)
            const symbol = decodeString(symbolResult as string)

            if (name && symbol) {
              // Calculate market cap from curve data or use default
              let marketCap = 0
              if (lensData && !lensData.graduated && lensData.price > 0) {
                // Estimate market cap: price * total supply (1B tokens typical)
                marketCap = lensData.price * 1_000_000_000
              }

              // Estimate creation time from block number
              const blockNum = tokenBlockNumbers.get(addr) || 0
              const createdAt = blockNum > 0
                ? new Date(Date.now() - (currentBlock - blockNum) * 500).toISOString() // ~500ms block time
                : new Date().toISOString()

              return {
                token: addr,
                name,
                symbol,
                description: undefined,
                image: undefined,
                creator: tokenCreators.get(addr) || '',
                createdAt,
                marketCap,
                price: lensData?.price || 0,
                priceChange24h: 0,
                volume24h: 0,
                holders: 0,
                graduated: lensData?.graduated ?? false,
                bondingCurveProgress: lensData?.progress || 0
              } as NadFunToken
            }
            return null
          } catch (err) {
            console.log(`Failed to get data for token ${addr}:`, err)
            return null
          }
        })
      )

      // Add successful results
      for (const result of batchResults) {
        if (result) {
          tokens.push(result)
        }
      }
    }

    const notGraduated = tokens.filter(t => !t.graduated).length
    console.log(`Successfully fetched ${tokens.length} tokens from bonding curve (${notGraduated} not graduated, ${tokens.length - notGraduated} graduated)`)
    return tokens
  } catch (error) {
    console.error('Failed to fetch from bonding curve:', error)
    return []
  }
}

// Decode hex string to UTF-8
function decodeString(hex: string): string {
  if (!hex || hex === '0x') return ''
  try {
    const data = hex.slice(2)
    if (data.length <= 64) {
      const bytes = Buffer.from(data, 'hex')
      return bytes.toString('utf8').replace(/\0/g, '').trim()
    }
    if (data.length >= 128) {
      const offset = parseInt(data.slice(0, 64), 16) * 2
      if (offset < data.length) {
        const length = parseInt(data.slice(offset, offset + 64), 16)
        if (length > 0 && length < 256) {
          const strHex = data.slice(offset + 64, offset + 64 + length * 2)
          return Buffer.from(strHex, 'hex').toString('utf8').replace(/\0/g, '').trim()
        }
      }
    }
    return ''
  } catch {
    return ''
  }
}

// Get all tokens combining multiple sources
async function getAllTokens(): Promise<NadFunToken[]> {
  // Fetch from all sources in parallel
  const [tokenBoosts, dexScreener, bondingCurve] = await Promise.allSettled([
    fetchFromTokenBoosts(),
    fetchFromDexScreener(),
    fetchFromBondingCurve()
  ])

  const tokens = new Map<string, NadFunToken>()

  // FIRST: Add bonding curve results (includes non-graduated tokens!)
  if (bondingCurve.status === 'fulfilled') {
    console.log(`Got ${bondingCurve.value.length} tokens from bonding curve events`)
    for (const token of bondingCurve.value) {
      tokens.set(token.token.toLowerCase(), token)
    }
  }

  // THEN: Add DEXScreener results (graduated tokens with price data)
  if (dexScreener.status === 'fulfilled') {
    console.log(`Got ${dexScreener.value.length} tokens from DEXScreener search`)
    for (const token of dexScreener.value) {
      const key = token.token.toLowerCase()
      const existing = tokens.get(key)
      if (existing) {
        // Merge: keep graduated status but update price data
        existing.price = token.price || existing.price
        existing.marketCap = token.marketCap || existing.marketCap
        existing.volume24h = token.volume24h || existing.volume24h
        existing.priceChange24h = token.priceChange24h || existing.priceChange24h
        existing.image = token.image || existing.image
      } else {
        tokens.set(key, { ...token, graduated: true }) // DEXScreener = graduated
      }
    }
  }

  // Add token boosts results (extra price data)
  if (tokenBoosts.status === 'fulfilled') {
    console.log(`Got ${tokenBoosts.value.length} tokens from token boosts`)
    for (const token of tokenBoosts.value) {
      const key = token.token.toLowerCase()
      const existing = tokens.get(key)
      if (existing) {
        // Merge price data
        existing.price = token.price || existing.price
        existing.marketCap = token.marketCap || existing.marketCap
        existing.volume24h = token.volume24h || existing.volume24h
        existing.image = token.image || existing.image
      } else {
        tokens.set(key, { ...token, graduated: true })
      }
    }
  }

  const allTokens = Array.from(tokens.values())
  const notGraduated = allTokens.filter(t => !t.graduated).length
  const graduated = allTokens.filter(t => t.graduated).length

  console.log(`Total tokens: ${allTokens.length} (${notGraduated} not graduated, ${graduated} graduated)`)
  return allTokens
}

// Get tokens ordered by creation time (newest first) - for "Newest" tab
export async function getTokensByCreationTime(page = 1, limit = 50): Promise<NadFunOrderResponse> {
  try {
    const allTokens = await getAllTokens()

    // Filter to only show tokens created in the last 24 hours (or all if few tokens)
    const now = Date.now()
    const oneDayAgo = now - (24 * 60 * 60 * 1000)

    // Sort purely by creation time (newest first) - this is the "Newest" tab
    const sorted = allTokens.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // For "Newest" tab, prioritize recent tokens but show all if needed
    const recentTokens = sorted.filter(t => new Date(t.createdAt).getTime() > oneDayAgo)
    const tokensToShow = recentTokens.length >= 10 ? recentTokens : sorted

    const start = (page - 1) * limit
    const paginatedTokens = tokensToShow.slice(start, start + limit)

    return {
      tokens: paginatedTokens,
      page,
      limit,
      total: tokensToShow.length
    }
  } catch (error) {
    console.error('Failed to fetch tokens by creation time:', error)
    return { tokens: [], page, limit, total: 0 }
  }
}

// Get tokens ordered by market cap (or progress for non-graduated)
export async function getTokensByMarketCap(page = 1, limit = 50): Promise<NadFunOrderResponse> {
  try {
    const allTokens = await getAllTokens()
    // Sort by: non-graduated by progress, graduated by market cap
    const sorted = allTokens.sort((a, b) => {
      // Non-graduated tokens: sort by progress (higher = closer to graduation)
      if (!a.graduated && !b.graduated) {
        return (b.bondingCurveProgress || 0) - (a.bondingCurveProgress || 0)
      }
      // Graduated tokens: sort by market cap
      if (a.graduated && b.graduated) {
        return b.marketCap - a.marketCap
      }
      // Mix: non-graduated first
      if (!a.graduated && b.graduated) return -1
      return 1
    })
    const start = (page - 1) * limit
    const paginatedTokens = sorted.slice(start, start + limit)

    return {
      tokens: paginatedTokens,
      page,
      limit,
      total: allTokens.length
    }
  } catch (error) {
    console.error('Failed to fetch tokens by market cap:', error)
    return { tokens: [], page, limit, total: 0 }
  }
}

// Get tokens ordered by activity (bonding curve progress for non-graduated, volume for graduated)
export async function getTokensByLatestTrade(page = 1, limit = 50): Promise<NadFunOrderResponse> {
  try {
    const allTokens = await getAllTokens()
    // Sort by: progress for non-graduated (most active), volume for graduated
    const sorted = allTokens.sort((a, b) => {
      // Non-graduated tokens: sort by progress
      if (!a.graduated && !b.graduated) {
        return (b.bondingCurveProgress || 0) - (a.bondingCurveProgress || 0)
      }
      // Graduated tokens: sort by volume
      if (a.graduated && b.graduated) {
        return (b.volume24h || 0) - (a.volume24h || 0)
      }
      // Mix: non-graduated first (more "trending")
      if (!a.graduated && b.graduated) return -1
      return 1
    })
    const start = (page - 1) * limit
    const paginatedTokens = sorted.slice(start, start + limit)

    return {
      tokens: paginatedTokens,
      page,
      limit,
      total: allTokens.length
    }
  } catch (error) {
    console.error('Failed to fetch tokens by latest trade:', error)
    return { tokens: [], page, limit, total: 0 }
  }
}

// Get token metadata
export async function getTokenInfo(tokenAddress: string): Promise<NadFunToken | null> {
  try {
    const response = await fetch(`${DEXSCREENER_API}/tokens/v1/monad/${tokenAddress}`)
    if (!response.ok) return null

    const data = await response.json()
    const pair = data.pairs?.[0] || data[0]
    if (!pair) return null

    return {
      token: pair.baseToken.address,
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol,
      description: undefined,
      image: pair.info?.imageUrl,
      creator: '',
      createdAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : '',
      marketCap: pair.marketCap || pair.fdv || 0,
      price: parseFloat(pair.priceUsd || '0'),
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || 0,
      holders: 0,
      graduated: true,
      bondingCurveProgress: 100
    }
  } catch {
    return null
  }
}

// Get token market data
export async function getTokenMarket(tokenAddress: string): Promise<NadFunTokenMarket | null> {
  const token = await getTokenInfo(tokenAddress)
  if (!token) return null

  return {
    token: token.token,
    price: token.price,
    marketCap: token.marketCap,
    volume24h: token.volume24h || 0,
    priceChange24h: token.priceChange24h || 0,
    high24h: 0,
    low24h: 0
  }
}

// Simplified functions
export async function getTokenHolders(tokenAddress: string): Promise<NadFunHolder[]> {
  return []
}

export async function getTokenSwaps(tokenAddress: string): Promise<NadFunSwap[]> {
  return []
}

export async function getTokenChart(tokenAddress: string): Promise<{ timestamp: number; price: number }[]> {
  return []
}

export async function getAccountCreatedTokens(address: string): Promise<NadFunToken[]> {
  return []
}

export async function getAccountPositions(address: string): Promise<{ token: string; balance: string; value: number }[]> {
  return []
}

// Get all tokens
export async function getAllNadFunTokens(): Promise<NadFunToken[]> {
  return getAllTokens()
}

// WebSocket class - placeholder for client-side real-time updates
export class NadFunWebSocket {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()

  connect(): void {
    console.log('NadFunWebSocket: Client-side only feature')
  }

  subscribe(method: string, params: Record<string, unknown>): void {
    console.log('NadFunWebSocket subscribe:', method, params)
  }

  subscribeToOrders(orderType: string): void {
    this.subscribe('order_subscribe', { order_type: orderType })
  }

  subscribeToCoin(coinId: string): void {
    this.subscribe('coin_subscribe', { coin_id: coinId })
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  disconnect(): void {
    console.log('NadFunWebSocket disconnected')
  }
}

export const nadFunWs = new NadFunWebSocket()
