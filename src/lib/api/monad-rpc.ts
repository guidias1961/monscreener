import { RPC_ENDPOINTS, getNextRpcUrl } from '@/lib/wagmi'
import { WalletInfo, TokenHolding, Transaction, TokenTransfer, SwapInfo } from '@/types'
import { retryWithBackoff } from '@/lib/utils'

// Simple RPC call without rate limiting complexity
async function simpleRpc(method: string, params: unknown[] = []): Promise<unknown> {
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

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`)
  }

  return data.result
}

// Get MON balance
export async function getBalance(address: string): Promise<string> {
  return retryWithBackoff(async () => {
    const result = await simpleRpc('eth_getBalance', [address, 'latest'])
    return result as string
  }, 2, 500)
}

// Get transaction count (nonce)
export async function getTransactionCount(address: string): Promise<number> {
  return retryWithBackoff(async () => {
    const result = await simpleRpc('eth_getTransactionCount', [address, 'latest'])
    return parseInt(result as string, 16)
  }, 2, 500)
}

// Get transaction by hash
export async function getTransactionByHash(hash: string): Promise<Transaction | null> {
  return retryWithBackoff(async () => {
    const tx = await simpleRpc('eth_getTransactionByHash', [hash]) as Record<string, string> | null

    if (!tx) return null

    const receipt = await simpleRpc('eth_getTransactionReceipt', [hash]) as Record<string, unknown> | null

    return {
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber, 16),
      timestamp: Date.now(),
      from: tx.from,
      to: tx.to || '',
      value: tx.value,
      gasUsed: receipt?.gasUsed as string || '0x0',
      gasPrice: tx.gasPrice,
      status: receipt?.status === '0x1' ? 'success' : 'failed',
      type: determineTransactionType(tx, receipt)
    }
  }, 2, 500)
}

// Get block by number
export async function getBlockByNumber(blockNumber: number | 'latest'): Promise<Record<string, unknown> | null> {
  return retryWithBackoff(async () => {
    const blockParam = typeof blockNumber === 'number'
      ? `0x${blockNumber.toString(16)}`
      : blockNumber

    return await simpleRpc('eth_getBlockByNumber', [blockParam, false]) as Record<string, unknown> | null
  }, 2, 500)
}

// Get current block number
export async function getBlockNumber(): Promise<number> {
  return retryWithBackoff(async () => {
    const result = await simpleRpc('eth_blockNumber', [])
    return parseInt(result as string, 16)
  }, 2, 500)
}

// Get gas price
export async function getGasPrice(): Promise<string> {
  return retryWithBackoff(async () => {
    return await simpleRpc('eth_gasPrice', []) as string
  }, 2, 500)
}

// Call contract method
export async function ethCall(to: string, data: string): Promise<string> {
  return retryWithBackoff(async () => {
    return await simpleRpc('eth_call', [{ to, data }, 'latest']) as string
  }, 2, 500)
}

// Get logs - with small block range only
export async function getLogs(filter: {
  fromBlock?: string | number
  toBlock?: string | number
  address?: string | string[]
  topics?: (string | string[] | null)[]
}): Promise<Array<Record<string, string>>> {
  return retryWithBackoff(async () => {
    const formattedFilter = {
      ...filter,
      fromBlock: typeof filter.fromBlock === 'number'
        ? `0x${filter.fromBlock.toString(16)}`
        : filter.fromBlock || 'latest',
      toBlock: typeof filter.toBlock === 'number'
        ? `0x${filter.toBlock.toString(16)}`
        : filter.toBlock || 'latest'
    }

    return await simpleRpc('eth_getLogs', [formattedFilter]) as Array<Record<string, string>>
  }, 2, 500)
}

// ERC20 ABI fragments
const ERC20_BALANCE_SELECTOR = '0x70a08231'
const ERC20_DECIMALS_SELECTOR = '0x313ce567'
const ERC20_SYMBOL_SELECTOR = '0x95d89b41'
const ERC20_NAME_SELECTOR = '0x06fdde03'

// Get ERC20 token balance
export async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
  try {
    const paddedAddress = walletAddress.slice(2).padStart(64, '0')
    const data = ERC20_BALANCE_SELECTOR + paddedAddress
    return await ethCall(tokenAddress, data)
  } catch {
    return '0x0'
  }
}

// Get token info
export async function getTokenInfo(tokenAddress: string): Promise<{ name: string; symbol: string; decimals: number }> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      ethCall(tokenAddress, ERC20_NAME_SELECTOR).catch(() => '0x'),
      ethCall(tokenAddress, ERC20_SYMBOL_SELECTOR).catch(() => '0x'),
      ethCall(tokenAddress, ERC20_DECIMALS_SELECTOR).catch(() => '0x12')
    ])

    return {
      name: decodeString(name),
      symbol: decodeString(symbol),
      decimals: parseInt(decimals, 16) || 18
    }
  } catch {
    return { name: 'Unknown', symbol: '???', decimals: 18 }
  }
}

// ERC20 Transfer event topic
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// Get token transfers using eth_getLogs
export async function getTokenTransfers(
  address: string,
  fromBlock: number,
  toBlock: number | 'latest'
): Promise<TokenTransfer[]> {
  try {
    const paddedAddress = '0x' + address.slice(2).toLowerCase().padStart(64, '0')
    const transfers: TokenTransfer[] = []

    // Query in batches of 100 blocks (RPC limit)
    const BATCH_SIZE = 100
    const endBlock = toBlock === 'latest' ? await getBlockNumber() : toBlock
    // Scan up to 50,000 blocks (~14 hours of history)
    const startBlock = Math.max(fromBlock, endBlock - 50000)

    // Create batch queries for parallel execution
    const batchPromises: Promise<TokenTransfer[]>[] = []

    // Process in groups of 10 parallel requests (1000 blocks per group)
    const PARALLEL_BATCHES = 10

    for (let groupStart = startBlock; groupStart < endBlock; groupStart += BATCH_SIZE * PARALLEL_BATCHES) {
      const batchGroup: Promise<TokenTransfer[]>[] = []

      for (let i = 0; i < PARALLEL_BATCHES && groupStart + i * BATCH_SIZE < endBlock; i++) {
        const start = groupStart + i * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE - 1, endBlock)

        // Query both TO and FROM in each batch
        batchGroup.push(
          (async () => {
            const results: TokenTransfer[] = []
            try {
              // Get transfers TO the address
              const logsTo = await getLogs({
                fromBlock: start,
                toBlock: end,
                topics: [TRANSFER_EVENT_TOPIC, null, paddedAddress]
              })
              for (const log of logsTo) {
                const transfer = await parseTransferLog(log, address)
                if (transfer) results.push(transfer)
              }

              // Get transfers FROM the address
              const logsFrom = await getLogs({
                fromBlock: start,
                toBlock: end,
                topics: [TRANSFER_EVENT_TOPIC, paddedAddress, null]
              })
              for (const log of logsFrom) {
                const transfer = await parseTransferLog(log, address)
                if (transfer) results.push(transfer)
              }
            } catch (e) {
              // Ignore batch errors, continue with others
            }
            return results
          })()
        )
      }

      // Wait for this group of batches
      const groupResults = await Promise.all(batchGroup)
      for (const results of groupResults) {
        transfers.push(...results)
      }

      // Stop early if we have enough transfers
      if (transfers.length >= 100) break
    }

    // Sort by block number descending and dedupe
    const seen = new Set<string>()
    return transfers
      .sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0))
      .filter(t => {
        const key = `${t.transactionHash}-${t.logIndex}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 100) // Limit to 100 transfers
  } catch (error) {
    console.error('Error fetching token transfers:', error)
    return []
  }
}

// Parse a Transfer event log
async function parseTransferLog(log: Record<string, string>, walletAddress: string): Promise<TokenTransfer | null> {
  try {
    const from = '0x' + log.topics[1].slice(26)
    const to = '0x' + log.topics[2].slice(26)
    const value = log.data

    // Get token info
    let tokenInfo = { name: 'Unknown', symbol: '???', decimals: 18 }
    try {
      tokenInfo = await getTokenInfo(log.address)
    } catch {
      // Use defaults
    }

    return {
      token: log.address,
      from,
      to,
      value,
      symbol: tokenInfo.symbol,
      name: tokenInfo.name,
      decimals: tokenInfo.decimals,
      transactionHash: log.transactionHash,
      blockNumber: parseInt(log.blockNumber, 16),
      logIndex: parseInt(log.logIndex, 16)
    }
  } catch {
    return null
  }
}

// Get recent transactions by scanning blocks
export async function getRecentTransactions(
  address: string,
  numBlocks: number = 500
): Promise<Transaction[]> {
  const transactions: Transaction[] = []
  const addressLower = address.toLowerCase()

  try {
    const currentBlock = await getBlockNumber()
    const startBlock = Math.max(0, currentBlock - numBlocks)

    // Scan recent blocks for transactions (in batches)
    const BATCH_SIZE = 10
    for (let blockNum = currentBlock; blockNum > startBlock && transactions.length < 50; blockNum -= BATCH_SIZE) {
      const blockPromises = []
      for (let i = 0; i < BATCH_SIZE && blockNum - i > startBlock; i++) {
        blockPromises.push(getBlockWithTransactions(blockNum - i))
      }

      const blocks = await Promise.all(blockPromises)

      for (const block of blocks) {
        if (!block || !block.transactions) continue

        for (const tx of block.transactions as Array<Record<string, string>>) {
          if (
            tx.from?.toLowerCase() === addressLower ||
            tx.to?.toLowerCase() === addressLower
          ) {
            transactions.push({
              hash: tx.hash,
              blockNumber: parseInt(block.number as string, 16),
              timestamp: parseInt(block.timestamp as string, 16) * 1000,
              from: tx.from,
              to: tx.to || '',
              value: tx.value,
              gasUsed: tx.gas || '0x0',
              gasPrice: tx.gasPrice || '0x0',
              status: 'success',
              type: determineTransactionType(tx, null)
            })
          }
        }
      }
    }

    return transactions.slice(0, 50)
  } catch (error) {
    console.error('Error fetching recent transactions:', error)
    return []
  }
}

// Get block with full transactions
export async function getBlockWithTransactions(blockNumber: number | 'latest'): Promise<Record<string, unknown> | null> {
  return retryWithBackoff(async () => {
    const blockParam = typeof blockNumber === 'number'
      ? `0x${blockNumber.toString(16)}`
      : blockNumber

    return await simpleRpc('eth_getBlockByNumber', [blockParam, true]) as Record<string, unknown> | null
  }, 2, 500)
}

// Get wallet info - fast version without block scanning
export async function getWalletInfo(address: string): Promise<WalletInfo> {
  try {
    // Fetch basic info (fast)
    const [balance, txCount] = await Promise.all([
      getBalance(address),
      getTransactionCount(address)
    ])

    // Calculate USD value (assuming MON price is ~$1 for now)
    const balanceInMon = parseInt(balance, 16) / 1e18
    const balanceUsd = balanceInMon * 1 // Placeholder price

    return {
      address,
      balance,
      balanceUsd,
      transactionCount: txCount,
      tokenHoldings: [],
      recentTransactions: []
    }
  } catch (error) {
    console.error('Error fetching wallet info:', error)
    return {
      address,
      balance: '0x0',
      balanceUsd: 0,
      transactionCount: 0,
      tokenHoldings: [],
      recentTransactions: []
    }
  }
}

// Fetch transactions separately (can be slow)
export async function fetchWalletTransactions(address: string): Promise<Transaction[]> {
  try {
    return await getRecentTransactions(address, 100)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
}

// Get recent swaps - simplified
export async function getRecentSwaps(
  address: string,
  fromBlock: number,
  toBlock: number | 'latest'
): Promise<SwapInfo[]> {
  // Return empty - would need indexer for this
  return []
}

// Helper: Determine transaction type
function determineTransactionType(
  tx: Record<string, string>,
  receipt: Record<string, unknown> | null
): 'transfer' | 'swap' | 'approve' | 'contract_call' | 'unknown' {
  if (!tx.to) return 'contract_call'
  if (!tx.input || tx.input === '0x') return 'transfer'

  const selector = tx.input.slice(0, 10).toLowerCase()

  if (selector === '0x095ea7b3') return 'approve'
  if (selector === '0x38ed1739' || selector === '0x7ff36ab5') return 'swap'
  if (selector === '0xa9059cbb') return 'transfer'

  return 'contract_call'
}

// Helper: Decode string from hex
function decodeString(hex: string): string {
  if (!hex || hex === '0x') return ''

  try {
    const data = hex.slice(2)

    // Try direct decode first (for short strings)
    if (data.length <= 64) {
      const bytes = Buffer.from(data, 'hex')
      return bytes.toString('utf8').replace(/\0/g, '').trim()
    }

    // Handle dynamic string encoding
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

// Batch multiple RPC calls
export async function batchRpcCalls(
  calls: Array<{ method: string; params: unknown[] }>
): Promise<unknown[]> {
  const url = getNextRpcUrl()

  const batchRequest = calls.map((call, index) => ({
    jsonrpc: '2.0',
    id: index,
    method: call.method,
    params: call.params
  }))

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchRequest)
  })

  if (!response.ok) {
    throw new Error(`RPC batch error: ${response.status}`)
  }

  const results = await response.json()

  if (Array.isArray(results)) {
    return results.sort((a: { id: number }, b: { id: number }) => a.id - b.id).map((r: { result: unknown }) => r.result)
  }

  return []
}
