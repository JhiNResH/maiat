import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkReviewQuality } from '@/lib/gemini-review-check'
import { spendScarab } from '@/lib/scarab'
import { hashReviewContent, submitReviewOnChain, isOnChainEnabled, getExplorerUrl } from '@/lib/onchain'

export const dynamic = 'force-dynamic'

// GET /api/reviews
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const projectId = searchParams.get('projectId')
  const sort = searchParams.get('sort') || 'new' // hot, new, top

  try {
    const where: any = {}

    if (category) {
      where.project = { category }
    }
    if (projectId) {
      where.projectId = projectId
    }

    let reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { address: true, displayName: true, avatarUrl: true } },
        project: { select: { id: true, name: true, category: true, image: true } },
      },
      orderBy:
        sort === 'new'
          ? { createdAt: 'desc' }
          : sort === 'top'
          ? [{ upvotes: 'desc' }, { downvotes: 'asc' }]
          : { createdAt: 'desc' },
    })

    const transformed = reviews.map((r) => ({
      id: r.id,
      projectId: r.project.id,
      projectName: r.project.name,
      projectImage: r.project.image,
      reviewerAddress: r.reviewer.address,
      reviewerName: r.reviewer.displayName,
      reviewerAvatar: r.reviewer.avatarUrl,
      rating: r.rating,
      content: r.content,
      category: r.project.category,
      upvotes: r.upvotes,
      downvotes: r.downvotes,
      createdAt: r.createdAt.toISOString(),
    }))

    return NextResponse.json({
      reviews: transformed,
      total: transformed.length,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, projectId, rating, content } = body

    if (!address || !projectId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Spend Scarab (-2 for review)
    try {
      await spendScarab(address, 'review_spend', projectId)
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    })
    if (!user) {
      user = await prisma.user.create({
        data: {
          address: address.toLowerCase(),
          displayName: address.substring(0, 10),
        },
      })
    }

    // Get project for quality check
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Quality check with Gemini API (only if content provided)
    let qualityCheck: {
      status: 'approved' | 'flagged' | 'rejected'
      score: number
      reason: string
      qualityIssues: string[]
    } = { status: 'approved', score: 100, reason: '', qualityIssues: [] }
    if (content && content.trim().length > 0) {
      qualityCheck = await checkReviewQuality(content, project.name, project.category)

      if (qualityCheck.status === 'rejected') {
        return NextResponse.json(
          {
            error: 'Review rejected - quality check failed',
            details: qualityCheck.reason,
            qualityIssues: qualityCheck.qualityIssues,
          },
          { status: 400 }
        )
      }
    }

    // Hash review content for on-chain proof
    const reviewContent = content?.trim() || ''
    const contentHash = hashReviewContent(reviewContent, rating, user.id)

    // Create review
    const review = await prisma.review.create({
      data: {
        reviewerId: user.id,
        projectId: project.id,
        rating,
        content: reviewContent,
        contentHash,
        status: qualityCheck.status === 'flagged' ? 'flagged' : 'active',
      },
      include: {
        reviewer: { select: { address: true, displayName: true, avatarUrl: true } },
        project: { select: { id: true, name: true, category: true, image: true } },
      },
    })

    // Attempt on-chain submission (non-blocking, best-effort)
    let onChainResult: { txHash: string; explorerUrl: string } | null = null
    if (isOnChainEnabled() && qualityCheck.status !== 'flagged') {
      try {
        const result = await submitReviewOnChain(project.category, project.id, contentHash)
        if (result) {
          await prisma.review.update({
            where: { id: review.id },
            data: {
              txHash: result.txHash,
              onChainReviewId: result.reviewId,
            },
          })
          onChainResult = {
            txHash: result.txHash,
            explorerUrl: getExplorerUrl(result.txHash),
          }
        }
      } catch (e) {
        console.error('On-chain submission failed (non-critical):', e)
      }
    }

    // Update project stats
    await prisma.project.update({
      where: { id: project.id },
      data: {
        reviewCount: { increment: 1 },
        avgRating: {
          set: (project.avgRating * project.reviewCount + rating) / (project.reviewCount + 1),
        },
      },
    })

    return NextResponse.json(
      {
        id: review.id,
        projectId: review.project.id,
        projectName: review.project.name,
        reviewerAddress: review.reviewer.address,
        rating: review.rating,
        content: review.content,
        category: review.project.category,
        upvotes: review.upvotes,
        downvotes: review.downvotes,
        createdAt: review.createdAt.toISOString(),
        qualityScore: qualityCheck.score,
        qualityStatus: qualityCheck.status,
        contentHash,
        onChain: onChainResult,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
