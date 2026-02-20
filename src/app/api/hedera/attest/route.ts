import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { submitReviewAttestation, hashReviewContent } from '@/lib/hedera'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hedera/attest
 * Submit a review attestation to Hedera Consensus Service
 */
export async function POST(request: NextRequest) {
  try {
    const { reviewId } = await request.json()

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { project: true, reviewer: true },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const contentHash = hashReviewContent(review.content)
    const trustScore = Math.min(100, Math.round(review.project.avgRating * 15 + review.project.reviewCount * 5))

    const result = await submitReviewAttestation({
      reviewId: review.id,
      projectName: review.project.name,
      projectSlug: review.project.slug,
      reviewer: review.reviewer?.address || 'anonymous',
      rating: review.rating,
      contentHash,
      trustScore,
      verificationStatus: review.status === 'verified' ? 'verified' : 'pending',
    })

    return NextResponse.json({
      success: true,
      hedera: {
        topicId: result.topicId,
        sequenceNumber: result.sequenceNumber,
        timestamp: result.timestamp,
        network: 'testnet',
        explorer: `https://hashscan.io/testnet/topic/${result.topicId}`,
      },
    })
  } catch (error: any) {
    console.error('[Hedera Attest] Error:', error)
    return NextResponse.json(
      { error: 'Attestation failed', details: error.message },
      { status: 500 }
    )
  }
}
