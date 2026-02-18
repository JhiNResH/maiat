import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUsage, getUsedProjects } from '@/lib/usage-proof'

export const dynamic = 'force-dynamic'

/**
 * GET /api/verify-usage?address=0x...&project=uniswap
 * → Check if wallet has used a specific project
 * 
 * GET /api/verify-usage?address=0x...
 * → List all projects this wallet has used (from our DB)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const projectQuery = searchParams.get('project')

  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 })
  }

  // Single project verification
  if (projectQuery) {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { slug: { equals: projectQuery, mode: 'insensitive' } },
          { name: { equals: projectQuery, mode: 'insensitive' } },
          { address: { equals: projectQuery, mode: 'insensitive' } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json({ error: `Project not found: ${projectQuery}` }, { status: 404 })
    }

    const proof = await verifyUsage(address, project.address, project.category)

    return NextResponse.json({
      project: project.name,
      slug: project.slug,
      wallet: address,
      ...proof,
      canReview: proof.verified,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  // List all used projects
  const projects = await prisma.project.findMany({
    select: { slug: true, address: true, category: true, name: true },
  })

  const usedProjects = await getUsedProjects(
    address,
    projects.map((p) => ({ slug: p.slug, address: p.address, category: p.category }))
  )

  return NextResponse.json({
    wallet: address,
    usedProjects: usedProjects.map((u) => ({
      slug: u.slug,
      name: projects.find((p) => p.slug === u.slug)?.name,
      ...u.proof,
      canReview: true,
    })),
    totalFound: usedProjects.length,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
