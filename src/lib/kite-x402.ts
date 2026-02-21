/**
 * Kite AI x402 Payment Integration
 * 
 * Implements x402-style payment flow for agent-to-API payments on Kite Chain.
 * Agents pay KITE tokens to query Maiat's trust score API.
 * 
 * Flow:
 * 1. Agent requests /api/v1/trust/:slug
 * 2. Server returns 402 Payment Required + payment details
 * 3. Agent signs payment authorization (EIP-712)
 * 4. Agent retries request with X-PAYMENT header
 * 5. Server verifies payment, settles on-chain, returns trust report
 * 
 * Kite Chain: https://docs.gokite.ai/
 * Testnet RPC: https://rpc-testnet.gokite.ai/ (Chain ID: 2368)
 * Mainnet RPC: https://rpc.gokite.ai/ (Chain ID: 2366)
 */

import { ethers } from 'ethers'

// Kite Chain config
const KITE_TESTNET_RPC = 'https://rpc-testnet.gokite.ai/'
const KITE_CHAIN_ID = 2368
const KITE_EXPLORER = 'https://testnet.kitescan.ai'

// Payment receiver (Maiat's wallet on Kite chain)
const MAIAT_RECEIVER = process.env.KITE_RECEIVER_ADDRESS || process.env.PRIVATE_KEY 
  ? '' // Will derive from PRIVATE_KEY
  : '0x0000000000000000000000000000000000000000'

// Pricing
const TRUST_QUERY_PRICE = '0.001' // 0.001 KITE per trust query
const REVIEW_VERIFY_PRICE = '0.005' // 0.005 KITE per review verification

// EIP-712 domain for x402 payment authorization
const PAYMENT_DOMAIN = {
  name: 'Maiat Trust Protocol',
  version: '1',
  chainId: KITE_CHAIN_ID,
  verifyingContract: '0x0000000000000000000000000000000000000000', // Native KITE, no contract
}

const PAYMENT_TYPES = {
  PaymentAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'action', type: 'string' },
    { name: 'resource', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
}

export interface PaymentRequirement {
  protocol: 'x402'
  version: '1.0'
  network: 'kite-testnet' | 'kite-mainnet'
  chainId: number
  receiver: string
  amount: string
  currency: 'KITE'
  action: string
  resource: string
  nonce: string
  deadline: number
  domain: typeof PAYMENT_DOMAIN
  types: typeof PAYMENT_TYPES
}

export interface PaymentHeader {
  from: string
  to: string
  value: string
  action: string
  resource: string
  nonce: string
  deadline: string
  signature: string
}

export interface PaymentVerification {
  valid: boolean
  from: string
  amount: string
  txHash?: string
  error?: string
}

/**
 * Get the Maiat receiver address on Kite chain
 */
function getReceiverAddress(): string {
  if (MAIAT_RECEIVER && MAIAT_RECEIVER !== '0x0000000000000000000000000000000000000000') {
    return MAIAT_RECEIVER
  }
  const privateKey = process.env.KITE_PRIVATE_KEY || process.env.PRIVATE_KEY
  if (!privateKey) throw new Error('No KITE_PRIVATE_KEY or PRIVATE_KEY configured')
  return new ethers.Wallet(privateKey).address
}

/**
 * Generate 402 Payment Required response details
 */
export function createPaymentRequirement(
  action: 'trust-query' | 'review-verify',
  resource: string,
): PaymentRequirement {
  const price = action === 'trust-query' ? TRUST_QUERY_PRICE : REVIEW_VERIFY_PRICE
  const nonce = Date.now().toString()
  const deadline = Math.floor(Date.now() / 1000) + 300 // 5 min expiry

  return {
    protocol: 'x402',
    version: '1.0',
    network: 'kite-testnet',
    chainId: KITE_CHAIN_ID,
    receiver: getReceiverAddress(),
    amount: price,
    currency: 'KITE',
    action,
    resource,
    nonce,
    deadline,
    domain: PAYMENT_DOMAIN,
    types: PAYMENT_TYPES,
  }
}

/**
 * Verify x402 payment header and settle on-chain
 */
export async function verifyAndSettlePayment(
  paymentHeader: string,
): Promise<PaymentVerification> {
  try {
    // Decode payment header (base64 JSON)
    const decoded: PaymentHeader = JSON.parse(
      Buffer.from(paymentHeader, 'base64').toString()
    )

    // Verify signature using EIP-712
    const recoveredAddress = ethers.verifyTypedData(
      PAYMENT_DOMAIN,
      PAYMENT_TYPES,
      {
        from: decoded.from,
        to: decoded.to,
        value: ethers.parseEther(decoded.value),
        action: decoded.action,
        resource: decoded.resource,
        nonce: BigInt(decoded.nonce),
        deadline: BigInt(decoded.deadline),
      },
      decoded.signature,
    )

    // Verify signer matches claimed sender
    if (recoveredAddress.toLowerCase() !== decoded.from.toLowerCase()) {
      return { valid: false, from: decoded.from, amount: decoded.value, error: 'Invalid signature' }
    }

    // Verify deadline
    if (Number(decoded.deadline) < Math.floor(Date.now() / 1000)) {
      return { valid: false, from: decoded.from, amount: decoded.value, error: 'Payment expired' }
    }

    // Verify receiver
    if (decoded.to.toLowerCase() !== getReceiverAddress().toLowerCase()) {
      return { valid: false, from: decoded.from, amount: decoded.value, error: 'Wrong receiver' }
    }

    // Settle on Kite chain — log payment attestation
    const txHash = await settleOnChain(decoded)

    return {
      valid: true,
      from: decoded.from,
      amount: decoded.value,
      txHash,
    }
  } catch (e: any) {
    return { valid: false, from: 'unknown', amount: '0', error: e.message }
  }
}

/**
 * Settle payment on Kite chain — write attestation tx
 */
async function settleOnChain(payment: PaymentHeader): Promise<string | undefined> {
  const privateKey = process.env.KITE_PRIVATE_KEY || process.env.PRIVATE_KEY
  if (!privateKey) return undefined

  try {
    const provider = new ethers.JsonRpcProvider(KITE_TESTNET_RPC)
    const wallet = new ethers.Wallet(privateKey, provider)

    const attestation = {
      type: 'maiat-x402-payment',
      protocol: 'x402',
      from: payment.from,
      to: payment.to,
      amount: payment.value,
      action: payment.action,
      resource: payment.resource,
      timestamp: Date.now(),
    }

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0,
      data: ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(attestation))),
    })

    await tx.wait()
    return tx.hash
  } catch (e: any) {
    console.error('[Kite x402 Settlement]', e.message)
    return undefined
  }
}

/**
 * Format 402 response for agents
 */
export function format402Response(requirement: PaymentRequirement) {
  return {
    status: 402,
    error: 'Payment Required',
    message: `This endpoint requires ${requirement.amount} ${requirement.currency} per request via x402 protocol.`,
    payment: requirement,
    instructions: {
      step1: 'Sign a PaymentAuthorization using EIP-712 with the provided domain and types',
      step2: 'Base64-encode the signed payload',
      step3: 'Retry the request with header: X-PAYMENT: <base64-payload>',
    },
    explorer: `${KITE_EXPLORER}`,
    docs: 'https://docs.gokite.ai/',
  }
}

/**
 * Get payment settlement URL on KiteScan
 */
export function getExplorerUrl(txHash: string): string {
  return `${KITE_EXPLORER}/tx/${txHash}`
}
