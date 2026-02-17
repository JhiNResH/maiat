import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeProject } from '@/app/actions/analyze'

export const dynamic = 'force-dynamic'

interface SearchResult {
  projects: Array<{
    id: string
    address: string
    name: string
    category: string
    avgRating: number
    reviewCount: number
  }>
  reviews: Array<{
    id: string
    content: string
    contentPreview: string
    rating: number
    reviewer: { address: string; displayName: string | null }
    project: { name: string; category: string }
  }>
  users: Array<{
    id: string
    address: string
    displayName: string | null
    reputationScore: number
  }>
  aiAnalysis?: any
}

// GET /api/search?q=query&analyze=true
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q')?.trim()
  const limit = parseInt(searchParams.get('limit') || '10')
  const analyze = searchParams.get('analyze') === 'true'

  if (!rawQuery || rawQuery.length < 2) {
    return NextResponse.json({ 
      error: 'Query must be at least 2 characters',
      projects: [],
      reviews: [],
      users: [],
    }, { status: 400 })
  }

  const query = rawQuery.toLowerCase()
  
  console.log(`[Maiat Search] Query: "${query}"`)

  const results: SearchResult = {
    projects: [],
    reviews: [],
    users: [],
  }

  try {
    // Search Projects (SQLite LIKE is case-insensitive by default)
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { address: { contains: query } },
          { category: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { reviewCount: 'desc' },
      select: {
        id: true,
        address: true,
        name: true,
        category: true,
        avgRating: true,
        reviewCount: true,
      },
    })
    results.projects = projects

    // Search Reviews (full-text on content)
    const reviews = await prisma.review.findMany({
      where: {
        content: { contains: query },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { address: true, displayName: true } },
        project: { select: { name: true, category: true } },
      },
    })
    results.reviews = reviews.map(r => ({
      id: r.id,
      content: r.content,
      contentPreview: r.content.length > 150 ? r.content.substring(0, 150) + '...' : r.content,
      rating: r.rating,
      reviewer: r.reviewer,
      project: r.project,
    }))

    // Search Users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { address: { contains: query } },
          { displayName: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { reputationScore: 'desc' },
      select: {
        id: true,
        address: true,
        displayName: true,
        reputationScore: true,
      },
    })
    results.users = users

    // Trigger AI Analysis if requested and no project matches found
    if (analyze && results.projects.length === 0) {
      console.log(`[Maiat Search] No DB match for "${rawQuery}", triggering AI analysis`)
      try {
        const analysis = await analyzeProject(rawQuery)
        results.aiAnalysis = {
          source: 'maiat',
          cached: analysis._cached || false,
          data: analysis,
        }
      } catch (err) {
        console.error('[Maiat Search] AI analysis failed:', err)
      }
    }

    return NextResponse.json({
      query,
      totalResults: results.projects.length + results.reviews.length + results.users.length,
      ...results,
    })
  } catch (error) {
    console.error('[Maiat Search] Error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
