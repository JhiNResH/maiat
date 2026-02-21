/**
 * x402 Payment Protocol — Maiat Implementation
 *
 * HTTP 402 "Payment Required" flow for agent-to-API micropayments.
 * Used by autonomous agents to pay for trust score queries.
 *
 * Flow:
 *   1. Agent requests /api/x402/trust-score → 402 + payment details
 *   2. Agent pays (via Kite AI or demo mode)
 *   3. Agent retries with X-Payment header containing tx proof
 *   4. Server validates → returns trust score
 *
 * Demo mode: accepts any X-Payment header starting with "demo:" or "0x"
 * Production mode: verifies tx on Kite AI testnet (Chain ID: 2368)
 */

export interface X402PaymentRequired {
  version: 'x402/1.0'
  accepts: PaymentOption[]
  memo: string
}

export interface PaymentOption {
  scheme: 'exact'
  network: string
  chainId: number
  maxAmountRequired: string       // in smallest unit (wei / microKITE)
  resource: string                // the resource being paid for
  description: string
  mimeType: string
  payTo: string                   // recipient address
  asset: string                   // token contract address (or 'native')
  outputSchema?: object
}

export interface X402PaymentProof {
  scheme: 'exact'
  network: string
  payload: {
    txHash: string
    from: string
    chainId: number
  }
}

// ─── Config ──────────────────────────────────────────────────────────

const KITE_CHAIN_ID = 2368
const KITE_RPC = 'https://rpc-testnet.gokite.ai'

// Maiat agent wallet — receives micropayments for trust score queries
// DEMO: using a known testnet address (no real value)
const MAIAT_PAYMENT_ADDRESS = process.env.MAIAT_PAYMENT_ADDRESS || '0xdEAD000000000000000042069420694206942069'

// Price per trust score query: 0.001 KITE (1000 microKITE)
const TRUST_SCORE_PRICE_WEI = '1000000000000000' // 0.001 ETH/KITE

// ─── 402 Response Builder ────────────────────────────────────────────

export function buildPaymentRequired(resource: string): X402PaymentRequired {
  return {
    version: 'x402/1.0',
    memo: `Maiat Trust Score Query — ${resource}`,
    accepts: [
      {
        scheme: 'exact',
        network: 'kite-testnet',
        chainId: KITE_CHAIN_ID,
        maxAmountRequired: TRUST_SCORE_PRICE_WEI,
        resource,
        description: `Trust score query for: ${resource}. Paid access to Maiat's verified review database.`,
        mimeType: 'application/json',
        payTo: MAIAT_PAYMENT_ADDRESS,
        asset: 'native', // native KITE token
        outputSchema: {
          type: 'object',
          properties: {
            trustScore: { type: 'number', description: '0-100 trust score' },
            reviewCount: { type: 'number' },
            avgRating: { type: 'number' },
            aiSummary: { type: 'string' },
          }
        }
      }
    ]
  }
}

// ─── Payment Validator ────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  demo: boolean
  txHash?: string
  from?: string
  error?: string
}

export async function validatePayment(
  paymentHeader: string,
  _resource: string
): Promise<ValidationResult> {

  // Parse x402 payment header (JSON or raw tx hash)
  let proof: X402PaymentProof | null = null
  let rawTx: string | null = null

  try {
    proof = JSON.parse(paymentHeader) as X402PaymentProof
    rawTx = proof.payload?.txHash
  } catch {
    // Maybe it's a raw tx hash
    rawTx = paymentHeader.trim()
  }

  // ─── Demo mode ──────────────────────────────────────────
  // Accept demo: prefix or any valid-looking 0x hash without on-chain check
  if (rawTx?.startsWith('demo:') || rawTx?.match(/^demo-/i)) {
    const fakeHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`
    return {
      valid: true,
      demo: true,
      txHash: fakeHash,
      from: '0xdemo_agent_' + rawTx.slice(5, 15),
    }
  }

  // ─── Simulated Kite AI verification ─────────────────────
  // In production: verify tx on chain ID 2368
  // For ETHDenver demo: accept any 0x... hash and simulate verification
  if (rawTx?.match(/^0x[a-fA-F0-9]{64}$/)) {
    // Simulate on-chain verification (demo mode)
    // In production: call Kite AI RPC to confirm tx
    const simulatedVerification = await simulateKiteVerification(rawTx)
    return {
      valid: simulatedVerification.confirmed,
      demo: simulatedVerification.demo,
      txHash: rawTx,
      from: proof?.payload?.from || simulatedVerification.from,
    }
  }

  return {
    valid: false,
    demo: false,
    error: 'Invalid payment proof format. Expected: demo:<id> or 0x<txhash> or JSON x402 payload',
  }
}

async function simulateKiteVerification(txHash: string): Promise<{
  confirmed: boolean
  demo: boolean
  from: string
}> {
  // Try real Kite testnet RPC first
  try {
    const response = await fetch(KITE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
      signal: AbortSignal.timeout(3000),
    })

    if (response.ok) {
      const data = await response.json() as { result?: { status: string; from: string } }
      if (data.result && data.result.status === '0x1') {
        return { confirmed: true, demo: false, from: data.result.from }
      }
    }
  } catch {
    // RPC unavailable — fall through to demo mode
  }

  // Demo fallback: accept any 0x hash
  return {
    confirmed: true,
    demo: true,
    from: `0xagent_${txHash.slice(2, 10)}`,
  }
}

// ─── Kite AI Logging ──────────────────────────────────────────────────

export interface KiteLogEntry {
  timestamp: number
  resource: string
  txHash: string
  from: string
  amount: string
  demo: boolean
  kiteExplorerUrl?: string
}

// In-memory log for demo (replace with DB in production)
const paymentLog: KiteLogEntry[] = []

export function logPayment(entry: KiteLogEntry) {
  paymentLog.unshift(entry) // newest first
  if (paymentLog.length > 100) paymentLog.pop()

  const explorer = entry.demo
    ? null
    : `https://testnet.kitescan.ai/tx/${entry.txHash}`

  console.log(`[x402] Payment logged:
  Resource: ${entry.resource}
  From:     ${entry.from}
  TxHash:   ${entry.txHash}
  Demo:     ${entry.demo}
  ${explorer ? `Explorer: ${explorer}` : ''}`)

  return { ...entry, kiteExplorerUrl: explorer || undefined }
}

export function getPaymentLog(): KiteLogEntry[] {
  return paymentLog
}
