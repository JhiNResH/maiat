/**
 * x402-gated Trust Score API
 *
 * Agents pay per query using the HTTP 402 payment protocol.
 * This endpoint demonstrates autonomous agent micropayments on Kite AI.
 *
 * Usage (agent):
 *   1. GET /api/x402/trust-score?slug=jerrys-coffee
 *      → 402 with payment instructions
 *
 *   2. GET /api/x402/trust-score?slug=jerrys-coffee
 *      with header: X-Payment: demo:agent-1
 *      → 200 with trust score data
 *
 * Demo payments: use X-Payment: demo:<anything>
 * Real payments: send 0.001 KITE to MAIAT_PAYMENT_ADDRESS on Kite testnet (chainId: 2368)
 *               then use X-Payment: <txHash>
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildPaymentRequired, validatePayment, logPayment } from '@/lib/x402'
import { calculateTrustScore } from '@/lib/trust-score'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug') || searchParams.get('token')

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing ?slug= parameter' },
      { status: 400 }
    )
  }

  const resource = `/api/x402/trust-score?slug=${slug}`
  const paymentHeader = request.headers.get('X-Payment')

  // ── Step 1: No payment header → return 402 ───────────────────────────
  if (!paymentHeader) {
    const paymentRequired = buildPaymentRequired(resource)

    return NextResponse.json(paymentRequired, {
      status: 402,
      headers: {
        'X-Payment-Response': 'required',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-Payment-Response',
      },
    })
  }

  // ── Step 2: Validate payment proof ───────────────────────────────────
  const validation = await validatePayment(paymentHeader, resource)

  if (!validation.valid) {
    return NextResponse.json(
      {
        error: 'Payment validation failed',
        message: validation.error,
        hint: 'Use X-Payment: demo:<id> for demo mode, or 0x<txhash> for Kite testnet',
      },
      { status: 402 }
    )
  }

  // ── Step 3: Log payment to Kite AI ───────────────────────────────────
  const logEntry = logPayment({
    timestamp: Date.now(),
    resource: slug,
    txHash: validation.txHash!,
    from: validation.from!,
    amount: '0.001 KITE',
    demo: validation.demo,
  })

  // ── Step 4: Return trust score ────────────────────────────────────────
  try {
    const trustData = await calculateTrustScore(slug)

    return NextResponse.json(
      {
        success: true,
        payment: {
          verified: true,
          txHash: validation.txHash,
          from: validation.from,
          demo: validation.demo,
          kiteExplorerUrl: logEntry.kiteExplorerUrl,
          network: 'kite-testnet',
          chainId: 2368,
          amount: '0.001 KITE',
        },
        data: trustData,
      },
      {
        status: 200,
        headers: {
          'X-Payment-Response': 'accepted',
          'X-Kite-TxHash': validation.txHash!,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': 'X-Payment-Response, X-Kite-TxHash',
        },
      }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Trust score calculation failed', message: msg },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Payment, Content-Type',
      'Access-Control-Expose-Headers': 'X-Payment-Response, X-Kite-TxHash',
    },
  })
}
