import { NextRequest, NextResponse } from 'next/server'
import { trustGatedSwapQuote, getSwapQuote, TOKENS } from '@/lib/uniswap'

export const dynamic = 'force-dynamic'

/**
 * POST /api/swap — Trust-gated swap via Uniswap API
 * 
 * Checks Maiat trust score before returning a Uniswap swap quote.
 * Low-trust tokens are warned or blocked.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tokenIn, tokenOut, amount, type = 'EXACT_INPUT',
      chainId = 1, swapper, slippageTolerance = 0.5,
      skipTrustCheck = false,
    } = body

    if (!tokenIn || !tokenOut || !amount || !swapper) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenIn, tokenOut, amount, swapper' },
        { status: 400 }
      )
    }

    if (skipTrustCheck) {
      // Direct Uniswap quote without trust gate
      const quote = await getSwapQuote({
        tokenIn, tokenOut, amount, type,
        tokenInChainId: chainId,
        tokenOutChainId: chainId,
        swapper,
        slippageTolerance,
      })
      return NextResponse.json({ allowed: true, quote })
    }

    // Trust-gated swap
    const result = await trustGatedSwapQuote({
      tokenIn, tokenOut, amount, type,
      tokenInChainId: chainId,
      tokenOutChainId: chainId,
      swapper,
      slippageTolerance,
    })

    return NextResponse.json(result, {
      status: result.allowed ? 200 : 403,
    })
  } catch (error: any) {
    console.error('[Swap API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Swap quote failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/swap — Quick quote (no trust gate, for UI preview)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenIn = searchParams.get('tokenIn') || TOKENS.ETH
  const tokenOut = searchParams.get('tokenOut') || TOKENS.USDC_MAINNET
  const amount = searchParams.get('amount') || '1000000000000000000' // 1 ETH
  const chainId = parseInt(searchParams.get('chainId') || '1')
  const swapper = searchParams.get('swapper') || '0x0000000000000000000000000000000000000000'

  try {
    const quote = await getSwapQuote({
      tokenIn, tokenOut, amount,
      type: 'EXACT_INPUT',
      tokenInChainId: chainId,
      tokenOutChainId: chainId,
      swapper,
    })

    return NextResponse.json({ quote })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
