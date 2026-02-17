import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/projects - List/search projects
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.toLowerCase()
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const sort = searchParams.get('sort') || 'rating' // rating, reviews, newest

  try {
    const where: any = {}
    
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { address: { contains: query } },
        { description: { contains: query } },
      ]
    }
    
    if (category) {
      where.category = category
    }

    let orderBy: any = { avgRating: 'desc' }
    switch (sort) {
      case 'reviews':
        orderBy = { reviewCount: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
    }

    const total = await prisma.project.count({ where })

    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        id: true,
        address: true,
        name: true,
        description: true,
        image: true,
        bannerImage: true,
        website: true,
        category: true,
        avgRating: true,
        reviewCount: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + projects.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, name, description, website, category, image } = body
    
    if (!address || !name) {
      return NextResponse.json({ error: 'address and name are required' }, { status: 400 })
    }

    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    // Check if project already exists
    const existing = await prisma.project.findUnique({
      where: { address: address.toLowerCase() },
    })
    
    if (existing) {
      return NextResponse.json({ error: 'Project already exists', project: existing }, { status: 409 })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        address: address.toLowerCase(),
        name,
        description: description || null,
        website: website || null,
        category: category || 'm/ai-agents',
        image: image || null,
        status: 'pending',
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
