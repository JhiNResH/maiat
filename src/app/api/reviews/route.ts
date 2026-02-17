import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sort = searchParams.get('sort') || 'hot'
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    let reviews

    switch (sort) {
      case 'new':
        reviews = await prisma.review.findMany({
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            reviewer: {
              select: {
                id: true,
                address: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                image: true,
                category: true,
              },
            },
          },
        })
        break

      case 'top':
        reviews = await prisma.review.findMany({
          where: { status: 'active' },
          orderBy: { upvotes: 'desc' },
          take: limit,
          include: {
            reviewer: {
              select: {
                id: true,
                address: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                image: true,
                category: true,
              },
            },
          },
        })
        break

      case 'hot':
      default:
        // Hot = upvotes - downvotes, with recent bias
        const allReviews = await prisma.review.findMany({
          where: { status: 'active' },
          include: {
            reviewer: {
              select: {
                id: true,
                address: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                image: true,
                category: true,
              },
            },
          },
        })

        // Calculate hot score: (upvotes - downvotes) / (days_old + 1)
        reviews = allReviews
          .map((r) => {
            const daysOld = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            const netVotes = r.upvotes - r.downvotes
            const hotScore = netVotes / (daysOld + 1)
            return { ...r, hotScore }
          })
          .sort((a, b) => b.hotScore - a.hotScore)
          .slice(0, limit)
        break
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
