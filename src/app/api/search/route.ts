import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchExternalAPIs } from '@/lib/coingecko'

export const dynamic = 'force-dynamic'

// GET /api/search?q=query&auto=true
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q')?.trim()
  const limit = parseInt(searchParams.get('limit') || '10')
  const autoCreate = searchParams.get('auto') !== 'false' // default true

  if (!rawQuery || rawQuery.length < 2) {
    return NextResponse.json({ 
      error: 'Query must be at least 2 characters',
      projects: [], reviews: [], users: [],
    }, { status: 400 })
  }

  const query = rawQuery.toLowerCase()
  console.log(`[Maiat Search] Query: "${query}"`)

  try {
    // Search local DB
    const [projects, reviews, users] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { reviewCount: 'desc' },
        select: {
          id: true, address: true, name: true, slug: true,
          category: true, avgRating: true, reviewCount: true,
          image: true, website: true, description: true,
        },
      }),
      prisma.review.findMany({
        where: { content: { contains: query, mode: 'insensitive' } },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { address: true, displayName: true } },
          project: { select: { name: true, category: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { address: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { reputationScore: 'desc' },
        select: { id: true, address: true, displayName: true, reputationScore: true },
      }),
    ])

    // If no projects found and autoCreate enabled, search external APIs
    let autoCreated = null
    if (projects.length === 0 && autoCreate) {
      console.log(`[Maiat Search] No local match for "${rawQuery}", searching external APIs...`)
      const externalData = await searchExternalAPIs(rawQuery)
      
      if (externalData) {
        const slug = externalData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        const address = externalData.address || `0x${externalData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 38).padEnd(38, '0')}`
        
        // Check uniqueness
        const existingSlug = await prisma.project.findUnique({ where: { slug } })
        const existingAddr = await prisma.project.findUnique({ where: { address } })
        
        if (!existingSlug && !existingAddr) {
          const newProject = await prisma.project.create({
            data: {
              address,
              name: externalData.name,
              slug,
              description: externalData.description || `${externalData.name} — via ${externalData.source}`,
              image: externalData.image || null,
              website: externalData.website || null,
              category: externalData.category,
              avgRating: 0,
              reviewCount: 0,
              status: 'approved',
            }
          })
          
          autoCreated = {
            id: newProject.id,
            address: newProject.address,
            name: newProject.name,
            slug: newProject.slug,
            category: newProject.category,
            avgRating: 0,
            reviewCount: 0,
            image: newProject.image,
            website: newProject.website,
            description: newProject.description,
          }
          projects.push(autoCreated as any)
          console.log(`[Maiat Search] Auto-created: ${newProject.name} from ${externalData.source}`)
        }
      }
    }

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      content: r.content,
      contentPreview: r.content.length > 150 ? r.content.substring(0, 150) + '...' : r.content,
      rating: r.rating,
      reviewer: r.reviewer,
      project: r.project,
    }))

    return NextResponse.json({
      query,
      totalResults: projects.length + formattedReviews.length + users.length,
      projects,
      reviews: formattedReviews,
      users,
      autoCreated: autoCreated ? true : false,
    })
  } catch (error) {
    console.error('[Maiat Search] Error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
