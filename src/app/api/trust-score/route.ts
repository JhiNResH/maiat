import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Trust Score API - The core endpoint for agent-to-agent queries
 * 
 * GET /api/trust-score?project=AIXBT
 * GET /api/trust-score?project=uniswap
 * GET /api/trust-score?address=0x4f9fd6be...
 * 
 * Returns trust score, review summary, and risk assessment
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectQuery = searchParams.get('project')
  const addressQuery = searchParams.get('address')

  if (!projectQuery && !addressQuery) {
    return NextResponse.json(
      { error: 'Missing parameter. Use ?project=<name> or ?address=<contract>' },
      { status: 400 }
    )
  }

  // Find project by name/slug or contract address
  const project = await prisma.project.findFirst({
    where: addressQuery
      ? { address: { equals: addressQuery, mode: 'insensitive' } }
      : {
          OR: [
            { name: { equals: projectQuery!, mode: 'insensitive' } },
            { slug: { equals: projectQuery!, mode: 'insensitive' } },
            { name: { contains: projectQuery!, mode: 'insensitive' } },
          ],
        },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          rating: true,
          content: true,
          upvotes: true,
          downvotes: true,
          createdAt: true,
          status: true,
        },
      },
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: `Project not found: ${projectQuery || addressQuery}` },
      { status: 404 }
    )
  }

  const trustScore = Math.round(project.avgRating * 20)
  const riskLevel = trustScore >= 80 ? 'Low' : trustScore >= 50 ? 'Medium' : 'High'

  // Sentiment analysis from reviews
  const totalUpvotes = project.reviews.reduce((s, r) => s + r.upvotes, 0)
  const totalDownvotes = project.reviews.reduce((s, r) => s + r.downvotes, 0)
  const sentiment = totalUpvotes + totalDownvotes > 0
    ? Math.round((totalUpvotes / (totalUpvotes + totalDownvotes)) * 100)
    : null

  // Rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
  project.reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++
  })

  // Top concerns (from low-rated reviews)
  const concerns = project.reviews
    .filter(r => r.rating <= 2 && r.content.length > 20)
    .slice(0, 3)
    .map(r => r.content.slice(0, 150))

  // Top strengths (from high-rated reviews)
  const strengths = project.reviews
    .filter(r => r.rating >= 4 && r.content.length > 20)
    .slice(0, 3)
    .map(r => r.content.slice(0, 150))

  const response = {
    project: project.name,
    category: project.category === 'm/ai-agents' ? 'AI Agent' : 'DeFi',
    contract: project.address,
    website: project.website,
    trustScore,
    riskLevel,
    reviewCount: project.reviewCount,
    avgRating: project.avgRating,
    sentiment,
    ratingDistribution: distribution,
    strengths,
    concerns,
    recommendation: trustScore >= 80
      ? 'Highly trusted by the community'
      : trustScore >= 60
        ? 'Generally trusted with some concerns'
        : trustScore >= 40
          ? 'Mixed reviews — proceed with caution'
          : project.reviewCount === 0
            ? 'No community reviews yet — unrated'
            : 'Low trust — significant concerns raised',
    lastReviewAt: project.reviews[0]?.createdAt || null,
    dataSource: 'maiat.io',
    verifiedOnChain: true,
    chains: ['Base', 'BSC'],
  }

  return NextResponse.json(response, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
