import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  hashReviewContent,
  submitReviewOnChain,
  verifyOnChain,
  isOnChainEnabled,
  getExplorerUrl,
} from '@/lib/onchain'
import type { Hex } from 'viem'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reviews/[id]/verify
 * Check on-chain verification status of a review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      reviewer: { select: { address: true } },
      project: { select: { category: true } },
    },
  })

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  // If we have a txHash, verify it on-chain
  if (review.txHash && review.onChainReviewId) {
    const verified = await verifyOnChain(review.onChainReviewId as Hex)
    return NextResponse.json({
      verified,
      txHash: review.txHash,
      onChainReviewId: review.onChainReviewId,
      explorerUrl: getExplorerUrl(review.txHash),
      contentHash: review.contentHash,
    })
  }

  return NextResponse.json({
    verified: false,
    txHash: null,
    onChainReviewId: null,
    explorerUrl: null,
    contentHash: review.contentHash,
  })
}

/**
 * POST /api/reviews/[id]/verify
 * Submit review to BSC on-chain (server-side relayer)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isOnChainEnabled()) {
    return NextResponse.json(
      { error: 'On-chain verification not available (contract not deployed)' },
      { status: 503 }
    )
  }

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      reviewer: { select: { address: true } },
      project: { select: { id: true, category: true } },
    },
  })

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  // Already verified
  if (review.txHash) {
    return NextResponse.json({
      alreadyVerified: true,
      txHash: review.txHash,
      explorerUrl: getExplorerUrl(review.txHash),
    })
  }

  // Hash the review content
  const contentHash = hashReviewContent(review.content, review.rating, review.reviewerId)

  // Submit on-chain
  const result = await submitReviewOnChain(
    review.project.category,
    review.project.id,
    contentHash
  )

  if (!result) {
    return NextResponse.json(
      { error: 'On-chain submission failed' },
      { status: 500 }
    )
  }

  // Update review with on-chain proof
  await prisma.review.update({
    where: { id },
    data: {
      txHash: result.txHash,
      contentHash,
      onChainReviewId: result.reviewId,
    },
  })

  return NextResponse.json({
    verified: true,
    txHash: result.txHash,
    onChainReviewId: result.reviewId,
    explorerUrl: getExplorerUrl(result.txHash),
    contentHash,
  })
}
