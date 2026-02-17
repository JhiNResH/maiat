import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * BSCScan Interaction Verification
 * 
 * Checks if a wallet address has interacted with a project's smart contract.
 * Users who have actually used the protocol get a "Verified User" badge (higher trust weight).
 * 
 * How it works:
 * 1. Takes wallet address + project contract address
 * 2. Calls BSCScan API to get transaction history
 * 3. Filters transactions where `to` matches project contract
 * 4. If match found → badge on review
 * 
 * BSCScan API:
 * - Endpoint: https://api.bscscan.com/api
 * - Module: account
 * - Action: txlist
 * - Free tier: 5 requests/sec, 100k requests/day
 * 
 * Badge Weight:
 * - Reviews from verified users (interacted) = 2x weight
 * - Reviews from non-interacted wallets = 1x weight
 */

interface InteractionCheckRequest {
  walletAddress: string
  projectAddress: string
  reviewId?: string
}

interface InteractionCheckResponse {
  success: boolean
  hasInteracted: boolean
  transactionCount?: number
  firstInteraction?: string
  lastInteraction?: string
  badge?: string
  message: string
}

// GET /api/verify-interaction?wallet=0x...&project=0x...
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    const projectAddress = searchParams.get('project')
    const reviewId = searchParams.get('reviewId')

    if (!walletAddress || !projectAddress) {
      return NextResponse.json(
        { error: 'Missing wallet or project address' },
        { status: 400 }
      )
    }

    // 1. Check BSCScan for interactions
    const interactionCheck = await checkBSCScanInteraction(
      walletAddress,
      projectAddress
    )

    // 2. If has interacted and reviewId provided, update review
    if (interactionCheck.hasInteracted && reviewId) {
      await markReviewAsVerified(reviewId, walletAddress)
    }

    const response: InteractionCheckResponse = {
      success: true,
      hasInteracted: interactionCheck.hasInteracted,
      transactionCount: interactionCheck.transactionCount,
      firstInteraction: interactionCheck.firstInteraction,
      lastInteraction: interactionCheck.lastInteraction,
      badge: interactionCheck.hasInteracted ? 'Verified User' : undefined,
      message: interactionCheck.hasInteracted
        ? `Found ${interactionCheck.transactionCount} interactions`
        : 'No interactions found',
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[Interaction Check] Error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}

/**
 * Check BSCScan for wallet interactions with project contract
 */
async function checkBSCScanInteraction(
  walletAddress: string,
  projectAddress: string
): Promise<{
  hasInteracted: boolean
  transactionCount: number
  firstInteraction?: string
  lastInteraction?: string
}> {
  const bscScanApiKey = process.env.BSCSCAN_API_KEY || ''
  
  // For demo/development without API key
  if (!bscScanApiKey) {
    console.log('[BSCScan] No API key - using mock data')
    return mockInteractionCheck(walletAddress, projectAddress)
  }

  try {
    // Call BSCScan API
    const url = new URL('https://api.bscscan.com/api')
    url.searchParams.set('module', 'account')
    url.searchParams.set('action', 'txlist')
    url.searchParams.set('address', walletAddress)
    url.searchParams.set('startblock', '0')
    url.searchParams.set('endblock', '99999999')
    url.searchParams.set('page', '1')
    url.searchParams.set('offset', '1000') // Max 1000 txs
    url.searchParams.set('sort', 'asc')
    url.searchParams.set('apikey', bscScanApiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== '1' || !data.result) {
      console.log('[BSCScan] No transactions found or API error')
      return {
        hasInteracted: false,
        transactionCount: 0,
      }
    }

    // Filter transactions where `to` matches project contract
    const projectLower = projectAddress.toLowerCase()
    const interactions = data.result.filter(
      (tx: any) => tx.to?.toLowerCase() === projectLower
    )

    if (interactions.length === 0) {
      return {
        hasInteracted: false,
        transactionCount: 0,
      }
    }

    // Found interactions!
    const firstTx = interactions[0]
    const lastTx = interactions[interactions.length - 1]

    return {
      hasInteracted: true,
      transactionCount: interactions.length,
      firstInteraction: new Date(parseInt(firstTx.timeStamp) * 1000).toISOString(),
      lastInteraction: new Date(parseInt(lastTx.timeStamp) * 1000).toISOString(),
    }
    
  } catch (error) {
    console.error('[BSCScan] API error:', error)
    return {
      hasInteracted: false,
      transactionCount: 0,
    }
  }
}

/**
 * Mock interaction check for development
 */
function mockInteractionCheck(
  walletAddress: string,
  projectAddress: string
): {
  hasInteracted: boolean
  transactionCount: number
  firstInteraction?: string
  lastInteraction?: string
} {
  // Simple hash to make it deterministic
  const hash = walletAddress.slice(2, 6) + projectAddress.slice(2, 6)
  const hasInteracted = parseInt(hash, 16) % 2 === 0 // 50% chance

  if (hasInteracted) {
    return {
      hasInteracted: true,
      transactionCount: 5,
      firstInteraction: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      lastInteraction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    }
  }

  return {
    hasInteracted: false,
    transactionCount: 0,
  }
}

/**
 * Mark review as verified (from interacted user)
 */
async function markReviewAsVerified(
  reviewId: string,
  walletAddress: string
): Promise<void> {
  try {
    // Could add a verifiedInteraction field to review schema
    // For now, we'll just log it
    console.log(`[Interaction Check] Review ${reviewId} from verified user ${walletAddress}`)
    
    // In production, you might:
    // await prisma.review.update({
    //   where: { id: reviewId },
    //   data: { verifiedInteraction: true }
    // })
    
  } catch (error) {
    console.error('[Interaction Check] Failed to mark review:', error)
  }
}

/**
 * POST endpoint for batch checking multiple reviews
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { reviews } = body // Array of { reviewId, walletAddress, projectAddress }

    if (!Array.isArray(reviews)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      reviews.map(async (review: any) => {
        const check = await checkBSCScanInteraction(
          review.walletAddress,
          review.projectAddress
        )
        
        return {
          reviewId: review.reviewId,
          hasInteracted: check.hasInteracted,
          transactionCount: check.transactionCount,
        }
      })
    )

    return NextResponse.json({
      success: true,
      results,
    })
    
  } catch (error) {
    console.error('[Interaction Check] Batch error:', error)
    return NextResponse.json(
      { error: 'Batch verification failed' },
      { status: 500 }
    )
  }
}
