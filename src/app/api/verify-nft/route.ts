import { NextRequest, NextResponse } from 'next/server'
import { checkNFTOwnership } from '@/lib/manifold'

export const dynamic = 'force-dynamic'

/**
 * POST /api/verify-nft
 * 
 * Verify if user owns NFT from Manifold merch collection
 * Used for gating reviews (only buyers can review)
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, contractAddress } = await request.json()

    if (!walletAddress || !contractAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress or contractAddress' },
        { status: 400 }
      )
    }

    // Check ownership on Base mainnet
    const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    const ownsNFT = await checkNFTOwnership(walletAddress, contractAddress, RPC_URL)

    return NextResponse.json({
      ownsNFT,
      walletAddress,
      contractAddress,
      message: ownsNFT
        ? 'Verified: User owns this NFT'
        : 'Not verified: User does not own this NFT',
    })
  } catch (error: any) {
    console.error('NFT verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed', details: error.message },
      { status: 500 }
    )
  }
}
