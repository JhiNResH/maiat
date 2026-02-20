import { NextRequest, NextResponse } from 'next/server'
import { getSwapQuote, TOKENS } from '@/lib/uniswap'
import { prisma } from '@/lib/prisma'
import { getSimpleTrustScore } from '@/lib/trust-score'
import { getUserReputation } from '@/lib/reputation'

export const dynamic = 'force-dynamic'

// Token address → slug mapping for DB lookup
const TOKEN_SLUGS: Record<string, string> = {
  '0x0000000000000000000000000000000000000000': 'eth',
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usdc',
  '0x4200000000000000000000000000000000000006': 'weth',
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'dai',
  '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf': 'cbbtc',
  '0x940181a94a35a4569e4529a3cdfb74e38fd98631': 'aerodrome',
  '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': 'degen',
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': 'usdt',
}

/**
 * Get token trust score from Maiat DB (community reviews + AI baseline)
 */
async function getTokenTrustScore(tokenAddress: string): Promise<{ score: number; reviewCount: number; avgRating: number; name: string }> {
  const slug = TOKEN_SLUGS[tokenAddress.toLowerCase()]
  if (!slug) return { score: 50, reviewCount: 0, avgRating: 0, name: 'Unknown' } // default for unlisted

  const project = await prisma.project.findUnique({ where: { slug } })
  if (!project) return { score: 50, reviewCount: 0, avgRating: 0, name: slug }

  const score = getSimpleTrustScore(project.name, project.category, project.avgRating, project.reviewCount)
  return { score, reviewCount: project.reviewCount, avgRating: project.avgRating, name: project.name }
}

/**
 * POST /api/swap — Trust-gated swap with reputation-based fees
 * 
 * 1. Check token trust score from community reviews
 * 2. Check user reputation → determine fee tier
 * 3. Return quote with trust + reputation data
 */
export async function POST(request: NextRequest) {
  try {
    const { tokenIn, tokenOut, amount, type = 'EXACT_INPUT', chainId = 8453, swapper, slippageTolerance = 0.5 } = await request.json()

    if (!tokenIn || !tokenOut || !amount || !swapper) {
      return NextResponse.json({ error: 'Missing: tokenIn, tokenOut, amount, swapper' }, { status: 400 })
    }

    // 1. Token trust score (what you're buying)
    const tokenTrust = await getTokenTrustScore(tokenOut)

    // 2. User reputation → fee tier
    const userRep = await getUserReputation(swapper)

    // 3. Trust gate
    if (tokenTrust.score < 30) {
      return NextResponse.json({
        allowed: false,
        trustScore: tokenTrust.score,
        tokenName: tokenTrust.name,
        riskLevel: 'high',
        warning: `🚫 ${tokenTrust.name} trust score is ${tokenTrust.score}/100 (${tokenTrust.reviewCount} reviews, avg ${tokenTrust.avgRating.toFixed(1)}★). Swap blocked.`,
        error: 'Trust score too low',
        userReputation: userRep,
      }, { status: 403 })
    }

    // 4. Get Uniswap quote
    let quote = null
    try {
      quote = await getSwapQuote({
        tokenIn, tokenOut, amount, type,
        tokenInChainId: chainId, tokenOutChainId: chainId,
        swapper, slippageTolerance,
      })
    } catch (e: any) {
      // Quote might fail but trust data is still valuable
      console.error('[Swap] Quote error:', e.message)
    }

    // 5. Calculate effective fee
    const baseFee = 0.5 // 0.5%
    const effectiveFee = userRep.feeTier
    const feeSaved = baseFee - effectiveFee

    return NextResponse.json({
      allowed: true,
      trustScore: tokenTrust.score,
      tokenName: tokenTrust.name,
      tokenReviews: tokenTrust.reviewCount,
      tokenRating: tokenTrust.avgRating,
      riskLevel: tokenTrust.score >= 80 ? 'low' : tokenTrust.score >= 50 ? 'medium' : 'high',
      warning: tokenTrust.score < 60
        ? `⚠️ ${tokenTrust.name} has moderate trust (${tokenTrust.score}/100). ${tokenTrust.reviewCount} community reviews.`
        : undefined,
      quote,
      // User reputation & fees
      userReputation: userRep,
      fees: {
        baseFee: `${baseFee}%`,
        effectiveFee: `${effectiveFee}%`,
        discount: userRep.feeDiscount,
        saved: feeSaved > 0 ? `${feeSaved}% saved` : null,
      },
    })
  } catch (error: any) {
    console.error('[Swap API] Error:', error)
    return NextResponse.json({ error: error.message || 'Swap failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenIn = searchParams.get('tokenIn') || TOKENS.ETH
  const tokenOut = searchParams.get('tokenOut') || TOKENS.USDC_BASE
  const amount = searchParams.get('amount') || '1000000000000000000'
  const chainId = parseInt(searchParams.get('chainId') || '8453')
  const swapper = searchParams.get('swapper') || '0x0000000000000000000000000000000000000000'

  try {
    const quote = await getSwapQuote({ tokenIn, tokenOut, amount, type: 'EXACT_INPUT', tokenInChainId: chainId, tokenOutChainId: chainId, swapper })
    return NextResponse.json({ quote })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
