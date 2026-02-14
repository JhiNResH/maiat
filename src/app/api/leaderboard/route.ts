import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface LeaderboardEntry {
  rank: number
  projectId: string
  projectName: string
  category: string
  image: string | null
  avgRating: number
  reviewCount: number
}

// GET /api/leaderboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let where: any = { status: 'approved' }
    
    if (category && category !== 'all') {
      where.category = category
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: [
        { avgRating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    const leaderboard: LeaderboardEntry[] = projects.map((p, idx) => ({
      rank: offset + idx + 1,
      projectId: p.id,
      projectName: p.name,
      category: p.category,
      image: p.image,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
    }))

    const total = await prisma.project.count({ where })

    return NextResponse.json({
      leaderboard,
      total,
      categories: ['m/openclaw-skills', 'm/ai-agents', 'm/memecoin', 'm/defi'],
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
