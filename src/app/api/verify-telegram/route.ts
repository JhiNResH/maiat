import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/verify-telegram
 * Link a Telegram user ID to a wallet address
 * After linking, Telegram reviews get the wallet's Base Verify status
 */
export async function POST(request: NextRequest) {
  try {
    const { telegramUserId, walletAddress } = await request.json()

    if (!telegramUserId || !walletAddress) {
      return NextResponse.json({ error: 'Missing telegramUserId or walletAddress' }, { status: 400 })
    }

    const tgAddress = `tg:${telegramUserId}`
    const wallet = walletAddress.toLowerCase()

    // Find or create the Telegram user
    let tgUser = await prisma.user.findUnique({ where: { address: tgAddress } })

    if (tgUser) {
      // Update: link wallet address (store in displayName for now)
      await prisma.user.update({
        where: { address: tgAddress },
        data: { displayName: wallet },
      })
    } else {
      tgUser = await prisma.user.create({
        data: { address: tgAddress, displayName: wallet },
      })
    }

    // Find or create wallet user and sync reputation
    let walletUser = await prisma.user.findUnique({ where: { address: wallet } })
    if (!walletUser) {
      walletUser = await prisma.user.create({
        data: { address: wallet, displayName: `TG:${telegramUserId}` },
      })
    }

    // Merge reputation: take the higher values
    const mergedRep = Math.max(tgUser.reputationScore, walletUser.reputationScore)
    const mergedReviews = tgUser.totalReviews + walletUser.totalReviews
    const mergedUpvotes = tgUser.totalUpvotes + walletUser.totalUpvotes

    // Update both users
    await prisma.user.update({
      where: { address: tgAddress },
      data: { reputationScore: mergedRep, totalReviews: mergedReviews, totalUpvotes: mergedUpvotes },
    })
    await prisma.user.update({
      where: { address: wallet },
      data: { reputationScore: mergedRep, totalReviews: mergedReviews, totalUpvotes: mergedUpvotes },
    })

    return NextResponse.json({
      success: true,
      linked: { telegram: tgAddress, wallet },
      reputationScore: mergedRep,
    })
  } catch (error: any) {
    console.error('[verify-telegram] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
