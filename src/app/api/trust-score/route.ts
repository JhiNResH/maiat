import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendReviewNeededAlert } from '@/lib/telegram-alert'

export const dynamic = 'force-dynamic'

/**
 * Trust Score Algorithm:
 * 
 * Phase 1 (0 reviews): AI baseline score based on project fundamentals
 *   - Known blue-chip DeFi (Aave, Uniswap, Lido etc) → 75-90
 *   - Known AI agents with traction → 60-80
 *   - New/unknown projects → 50
 * 
 * Phase 2 (1-5 reviews): AI baseline 60% + Community 40%
 * Phase 3 (6-20 reviews): AI baseline 30% + Community 70%
 * Phase 4 (20+ reviews): AI baseline 10% + Community 90%
 */

// AI baseline scores for known projects (based on TVL, age, audits, team)
const KNOWN_SCORES: Record<string, number> = {
  // Blue-chip DeFi
  'aave': 88, 'uniswap': 90, 'lido': 85, 'compound': 82, 'curve finance': 84,
  'pancakeswap': 80, 'ethena': 75, 'ether.fi': 78, 'morpho': 76, 'pendle': 74,
  'sky (makerdao)': 86,
  // Top AI Agents
  'aixbt': 82, 'g.a.m.e': 78, 'luna': 75, 'vaderai': 72, 'neurobro': 68,
  'billybets': 65, 'ethy ai': 70, 'music': 62, 'tracy.ai': 60, 'acolyt': 64,
  '1000x': 58, 'araistotle': 56, 'ribbita': 55, 'mamo': 60, 'freya protocol': 58,
}

function getAIBaselineScore(name: string, category: string): number {
  const known = KNOWN_SCORES[name.toLowerCase()]
  if (known) return known
  // Default baseline by category
  return category === 'm/defi' ? 60 : 50
}

function calculateTrustScore(
  aiBaseline: number,
  avgRating: number,
  reviewCount: number
): { score: number; aiWeight: number; communityWeight: number } {
  if (reviewCount === 0) {
    return { score: aiBaseline, aiWeight: 100, communityWeight: 0 }
  }
  
  const communityScore = Math.round(avgRating * 20) // 1-5 → 20-100
  
  let aiWeight: number, communityWeight: number
  if (reviewCount <= 5) {
    aiWeight = 60; communityWeight = 40
  } else if (reviewCount <= 20) {
    aiWeight = 30; communityWeight = 70
  } else {
    aiWeight = 10; communityWeight = 90
  }
  
  const score = Math.round((aiBaseline * aiWeight + communityScore * communityWeight) / 100)
  return { score, aiWeight, communityWeight }
}

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

  const aiBaseline = getAIBaselineScore(project.name, project.category)
  const { score: trustScore, aiWeight, communityWeight } = calculateTrustScore(
    aiBaseline, project.avgRating, project.reviewCount
  )
  const riskLevel = trustScore >= 80 ? 'Low' : trustScore >= 50 ? 'Medium' : 'High'

  // Sentiment
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

  const concerns = project.reviews.filter(r => r.rating <= 2 && r.content.length > 20).slice(0, 3).map(r => r.content.slice(0, 150))
  const strengths = project.reviews.filter(r => r.rating >= 4 && r.content.length > 20).slice(0, 3).map(r => r.content.slice(0, 150))

  const chain = project.category === 'm/ai-agents' ? 'Base' : 
    project.name === 'PancakeSwap' ? 'BNB Chain' : 'Ethereum'

  const responseData = {
    project: project.name,
    category: project.category === 'm/ai-agents' ? 'AI Agent' : 'DeFi',
    contract: project.address,
    website: project.website,
    chain,
    trustScore,
    riskLevel,
    scoreBreakdown: {
      aiBaseline,
      communityScore: project.reviewCount > 0 ? Math.round(project.avgRating * 20) : null,
      aiWeight,
      communityWeight,
      note: project.reviewCount === 0
        ? 'AI-only score. Write reviews to refine.'
        : `Weighted: AI ${aiWeight}% + Community ${communityWeight}%`,
    },
    reviewCount: project.reviewCount,
    avgRating: project.avgRating,
    sentiment,
    ratingDistribution: distribution,
    strengths,
    concerns,
    recommendation: trustScore >= 80
      ? 'Highly trusted — established project with strong fundamentals'
      : trustScore >= 65
        ? 'Generally trusted — solid with minor concerns'
        : trustScore >= 50
          ? 'Mixed signals — do your own research'
          : 'Low trust — significant concerns or insufficient data',
    lastReviewAt: project.reviews[0]?.createdAt || null,
    dataSource: 'maiat.vercel.app',
  }

  // Send Telegram alert if project needs more reviews
  if (project.reviewCount < 5) {
    const queriedBy = request.headers.get('x-agent-address') || request.headers.get('user-agent')?.slice(0, 50)
    sendReviewNeededAlert(project.name, trustScore, project.reviewCount, queriedBy || undefined)
      .catch(() => {}) // fire-and-forget, don't block response
  }

  return NextResponse.json(responseData, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
