import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { spendScarab } from '@/lib/scarab'

/**
 * POST /api/projects/[id]/vote
 * Vote on a project (weekly opinion vote, costs 5 Scarab)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const body = await request.json()
    const { address, voteType } = body // voteType: "upvote" | "downvote"

    if (!address || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const normalizedAddress = address.toLowerCase()

    // Find or create user (must exist before spending Scarab)
    let user = await prisma.user.findUnique({ where: { address: normalizedAddress } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          address: normalizedAddress,
          displayName: address.substring(0, 10),
        },
      })
    }

    // Spend Scarab — dedup check is atomic inside spendScarab (TOCTOU-safe)
    try {
      await spendScarab(normalizedAddress, 'vote_spend', projectId)
    } catch (e: any) {
      const status = e.message.includes('Already voted') ? 409 : 400
      return NextResponse.json({ error: e.message }, { status })
    }

    return NextResponse.json({
      success: true,
      projectId,
      voteType,
      scarabSpent: 5,
    })
  } catch (error) {
    console.error('Error recording project vote:', error)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
}
