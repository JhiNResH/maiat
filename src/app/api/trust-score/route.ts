import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trust-score?project=AIXBT
 * 
 * Public API for agents to query trust scores.
 * No auth required. This is the core service endpoint.
 */
export async function GET(request: NextRequest) {
  const projectName = request.nextUrl.searchParams.get('project')

  if (!projectName) {
    return NextResponse.json(
      { error: 'Missing ?project= parameter' },
      { status: 400 }
    )
  }

  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { name: { contains: projectName, mode: 'insensitive' } },
        { address: { contains: projectName, mode: 'insensitive' } },
      ]
    },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          reviewer: { select: { displayName: true } },
        },
      },
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found', query: projectName },
      { status: 404 }
    )
  }

  const trustScore = Math.round(project.avgRating * 20)
  const risk = trustScore >= 80 ? 'low' : trustScore >= 50 ? 'medium' : 'high'

  return NextResponse.json({
    name: project.name,
    address: project.address,
    category: project.category,
    trustScore,
    avgRating: project.avgRating,
    reviewCount: project.reviewCount,
    risk,
    latestReviews: project.reviews.map(r => ({
      rating: r.rating,
      content: r.content,
      reviewer: r.reviewer.displayName,
      date: r.createdAt.toISOString().split('T')[0],
    })),
    // For callback after using the score
    callbackUrl: `https://maiat.xyz/api/reviews`,
    botLink: 'https://t.me/MaiatBot',
  })
}
