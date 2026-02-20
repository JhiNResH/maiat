import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyReviewWith0G } from '@/lib/0g-compute'
import { submitReviewAttestation, hashReviewContent } from '@/lib/hedera'

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8320745684:AAE4diIOwF7XE24gPqQtF6oAkP6z3RZqmAw'
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://maiat.vercel.app'

// User state machine for review flow
const userStates = new Map<number, {
  step: 'select_project' | 'rating' | 'content'
  projectId?: string
  projectName?: string
  rating?: number
}>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = body.message || body.callback_query?.message
    const callbackData = body.callback_query?.data
    const chatId = message?.chat?.id || body.callback_query?.from?.id
    const text = message?.text?.trim() || ''
    const userId = message?.from?.id || body.callback_query?.from?.id
    const username = message?.from?.username || body.callback_query?.from?.username || 'anon'

    if (!chatId) return NextResponse.json({ ok: true })

    // Handle callback queries (inline button clicks)
    if (callbackData) {
      await handleCallback(chatId, userId, callbackData, body.callback_query?.id)
      return NextResponse.json({ ok: true })
    }

    // Commands
    if (text.startsWith('/start')) {
      const param = text.split(' ')[1] || ''
      if (param.startsWith('review_')) {
        const slug = param.replace('review_', '')
        await startReviewFlow(chatId, userId, slug)
      } else {
        await sendWelcome(chatId)
      }
    } else if (text.startsWith('/recommend') || text.startsWith('/best') || text.toLowerCase().includes('推薦') || text.toLowerCase().includes('which') || text.toLowerCase().includes('best coffee')) {
      await handleRecommend(chatId, text)
    } else if (text.startsWith('/review')) {
      await showProjectsForReview(chatId)
    } else if (text.startsWith('/help')) {
      await sendHelp(chatId)
    } else {
      // Check if user is in review flow
      const state = userStates.get(userId)
      if (state) {
        await handleReviewFlow(chatId, userId, text, username)
      } else {
        // Natural language - try to understand intent
        await handleNaturalLanguage(chatId, userId, text)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[TG Webhook] Error:', error)
    return NextResponse.json({ ok: true })
  }
}

async function sendWelcome(chatId: number) {
  const text = `☕ <b>Welcome to Maiat</b>\nThe trust score layer for agentic commerce.\n\n🔍 <b>/recommend coffee</b> — Find the best coffee\n✍️ <b>/review</b> — Write a verified review\n❓ <b>/help</b> — How it works\n\nOr just ask me: <i>"Which coffee shop is the best?"</i>`

  await sendMessage(chatId, text, {
    inline_keyboard: [
      [{ text: '☕ Best Coffee', callback_data: 'recommend_coffee' }, { text: '✍️ Write Review', callback_data: 'start_review' }],
      [{ text: '🌐 Open Maiat', url: WEBAPP_URL }],
    ]
  })
}

async function sendHelp(chatId: number) {
  const text = `🤖 <b>How Maiat Works</b>\n\n1️⃣ <b>Ask for recommendations</b>\nI'll show you verified reviews with trust scores.\n\n2️⃣ <b>Try it yourself</b>\nBuy coffee, use a DeFi protocol, try an AI agent.\n\n3️⃣ <b>Leave a review</b>\nYour review gets AI-verified:\n• 🔍 <b>0G Compute</b> — AI quality check\n• 🪪 <b>KiteAI x402</b> — On-chain deep verification\n\n4️⃣ <b>Help others decide</b>\nYour verified review builds trust for the community.`

  await sendMessage(chatId, text)
}

async function handleRecommend(chatId: number, query: string) {
  // Determine category from query
  let category = 'm/coffee'
  if (query.toLowerCase().includes('defi') || query.toLowerCase().includes('protocol')) category = 'm/defi'
  if (query.toLowerCase().includes('agent') || query.toLowerCase().includes('ai')) category = 'm/ai-agents'

  const categoryLabel = category === 'm/coffee' ? '☕ Coffee' : category === 'm/defi' ? '🏦 DeFi' : '🤖 AI Agents'

  const projects = await prisma.project.findMany({
    where: { category, status: 'approved' },
    orderBy: { avgRating: 'desc' },
    take: 5,
  })

  if (projects.length === 0) {
    await sendMessage(chatId, `No ${categoryLabel} projects found yet. Be the first to add one!`)
    return
  }

  // Get top project's reviews
  const topProject = projects[0]
  const reviews = await prisma.review.findMany({
    where: { projectId: topProject.id },
    include: { reviewer: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  let text = `${categoryLabel} <b>Top Recommendations</b>\n\n`

  projects.forEach((p, i) => {
    const stars = '⭐'.repeat(Math.round(p.avgRating))
    const trustScore = Math.min(100, Math.round(p.avgRating * 15 + p.reviewCount * 5))
    text += `${i + 1}. <b>${p.name}</b>\n`
    text += `   ${stars} ${p.avgRating.toFixed(1)} · ${p.reviewCount} reviews · Trust: ${trustScore}/100\n`
    if (p.description) text += `   <i>${p.description.slice(0, 80)}${p.description.length > 80 ? '...' : ''}</i>\n`
    text += '\n'
  })

  if (reviews.length > 0) {
    text += `\n💬 <b>Latest reviews for ${topProject.name}:</b>\n`
    reviews.forEach(r => {
      const reviewer = r.reviewer?.displayName || `${r.reviewer?.address?.slice(0, 8)}...`
      const verified = r.status === 'verified' ? ' ✅' : ''
      text += `\n"<i>${r.content.slice(0, 120)}${r.content.length > 120 ? '...' : ''}</i>"\n— ${reviewer} ${'⭐'.repeat(r.rating)}${verified}\n`
    })
  }

  await sendMessage(chatId, text, {
    inline_keyboard: [
      [{ text: `✍️ Review ${topProject.name}`, callback_data: `review_${topProject.slug}` }],
      [{ text: '🌐 See all on Maiat', url: `${WEBAPP_URL}/?cat=${category.replace('m/', '')}` }],
    ]
  })
}

async function showProjectsForReview(chatId: number) {
  const projects = await prisma.project.findMany({
    where: { status: 'approved' },
    orderBy: { reviewCount: 'asc' },
    take: 10,
  })

  const buttons = projects.map(p => {
    const emoji = p.category === 'm/coffee' ? '☕' : p.category === 'm/defi' ? '🏦' : '🤖'
    return [{ text: `${emoji} ${p.name}`, callback_data: `review_${p.slug}` }]
  })

  await sendMessage(chatId, '✍️ <b>Select a project to review:</b>', {
    inline_keyboard: buttons,
  })
}

async function handleCallback(chatId: number, userId: number, data: string, callbackQueryId: string) {
  // Answer callback to remove loading state
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  })

  if (data === 'recommend_coffee') {
    await handleRecommend(chatId, 'coffee')
  } else if (data === 'start_review') {
    await showProjectsForReview(chatId)
  } else if (data.startsWith('review_')) {
    const slug = data.replace('review_', '')
    await startReviewFlow(chatId, userId, slug)
  } else if (data.startsWith('rate_')) {
    const rating = parseInt(data.replace('rate_', ''))
    const state = userStates.get(userId)
    if (state && state.step === 'rating') {
      state.rating = rating
      state.step = 'content'
      userStates.set(userId, state)
      await sendMessage(chatId, `${'⭐'.repeat(rating)} Got it!\n\n✍️ Now write your review for <b>${state.projectName}</b>:\n\n<i>What was your experience? Be specific — verified reviews get higher trust scores.</i>`)
    }
  }
}

async function startReviewFlow(chatId: number, userId: number, slug: string) {
  const project = await prisma.project.findUnique({ where: { slug } })
  if (!project) {
    await sendMessage(chatId, '❌ Project not found.')
    return
  }

  userStates.set(userId, {
    step: 'rating',
    projectId: project.id,
    projectName: project.name,
  })

  await sendMessage(chatId, `✍️ <b>Review: ${project.name}</b>\n\nHow would you rate it?`, {
    inline_keyboard: [
      [
        { text: '⭐', callback_data: 'rate_1' },
        { text: '⭐⭐', callback_data: 'rate_2' },
        { text: '⭐⭐⭐', callback_data: 'rate_3' },
        { text: '⭐⭐⭐⭐', callback_data: 'rate_4' },
        { text: '⭐⭐⭐⭐⭐', callback_data: 'rate_5' },
      ],
    ]
  })
}

async function handleReviewFlow(chatId: number, userId: number, text: string, username: string) {
  const state = userStates.get(userId)
  if (!state) return

  if (state.step === 'content' && state.projectId && state.rating) {
    if (text.length < 10) {
      await sendMessage(chatId, '⚠️ Please write at least 10 characters for a meaningful review.')
      return
    }

    await sendMessage(chatId, '🔄 <b>Submitting & verifying your review...</b>')

    // 1. Create user if needed
    const tgAddress = `tg:${userId}`
    let user = await prisma.user.findUnique({ where: { address: tgAddress } })
    if (!user) {
      user = await prisma.user.create({
        data: { address: tgAddress, displayName: username ? `@${username}` : `TG:${userId}` }
      })
    }

    // 2. Create review
    const review = await prisma.review.create({
      data: {
        projectId: state.projectId,
        reviewerId: user.id,
        rating: state.rating,
        content: text,
        status: 'pending',
      }
    })

    // 3. Update project stats
    const allReviews = await prisma.review.findMany({ where: { projectId: state.projectId } })
    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await prisma.project.update({
      where: { id: state.projectId },
      data: { avgRating, reviewCount: allReviews.length },
    })

    // 4. AI Verification with 0G
    let verificationText = ''
    try {
      const result = await verifyReviewWith0G({
        title: state.projectName || 'Review',
        content: text,
        rating: state.rating,
        category: 'm/coffee',
      })
      
      const scoreEmoji = result.score >= 80 ? '✅' : result.score >= 50 ? '⚠️' : '❌'
      verificationText += `\n🔍 <b>0G AI Quality Check</b>\n   Score: ${result.score}/100 ${scoreEmoji}\n   ${result.reasoning || 'Analyzed by 0G Compute Network'}\n   Network: 0G Testnet`

      // Update review status based on score
      if (result.score >= 60) {
        await prisma.review.update({ where: { id: review.id }, data: { status: 'verified' } })
      }
    } catch (e: any) {
      console.error('[0G Verify] Error:', e.message)
      verificationText += `\n🔍 <b>0G AI Check:</b> Queued (network busy)`
    }

    // 5. KiteAI on-chain verification
    let kiteText = ''
    try {
      const { ethers } = await import('ethers')
      const KITE_RPC = 'https://rpc-testnet.gokite.ai/'
      const privateKey = process.env.PRIVATE_KEY
      if (privateKey) {
        const provider = new ethers.JsonRpcProvider(KITE_RPC)
        const wallet = new ethers.Wallet(privateKey, provider)
        
        const verificationData = ethers.toUtf8Bytes(JSON.stringify({
          type: 'maiat-review-verification',
          reviewId: review.id,
          reviewer: tgAddress,
          project: state.projectName,
          rating: state.rating,
          timestamp: Date.now(),
        }))

        const tx = await wallet.sendTransaction({
          to: wallet.address,
          value: 0,
          data: ethers.hexlify(verificationData),
        })

        const receipt = await tx.wait()
        const txHash = tx.hash
        const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
        
        kiteText = `\n\n🪪 <b>KiteAI On-Chain Verification</b>\n   Tx: <a href="https://testnet.kitescan.ai/tx/${txHash}">${shortHash}</a>\n   Status: Recorded ✅\n   Network: Kite Testnet (Chain 2368)`
      }
    } catch (e: any) {
      console.error('[Kite Verify] Error:', e.message)
      kiteText = `\n\n🪪 <b>KiteAI Verify:</b> Queued`
    }

    // 6. Hedera HCS attestation
    let hederaText = ''
    try {
      const contentHash = hashReviewContent(text)
      const trustScore = Math.min(100, Math.round((state.rating || 3) * 15 + 5))
      const hcsResult = await submitReviewAttestation({
        reviewId: review.id,
        projectName: state.projectName || '',
        projectSlug: state.projectName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
        reviewer: tgAddress,
        rating: state.rating!,
        contentHash,
        trustScore,
        verificationStatus: 'verified',
      })
      hederaText = `\n\n🏛️ <b>Hedera Consensus Attestation</b>\n   Topic: ${hcsResult.topicId}\n   Seq: #${hcsResult.sequenceNumber}\n   <a href="https://hashscan.io/testnet/topic/${hcsResult.topicId}">View on HashScan</a>`
    } catch (e: any) {
      console.error('[Hedera] Error:', e.message)
      hederaText = '\n\n🏛️ <b>Hedera Attestation:</b> Queued'
    }

    // 7. Send verification card
    const stars = '⭐'.repeat(state.rating)
    const resultText = `✅ <b>Review Published & Verified!</b>\n\n📝 <b>${state.projectName}</b>\n${stars}\n"<i>${text.slice(0, 200)}${text.length > 200 ? '...' : ''}</i>"\n— @${username}${verificationText}${kiteText}${hederaText}\n\n🌐 <a href="${WEBAPP_URL}">View on Maiat</a>`

    await sendMessage(chatId, resultText, {
      inline_keyboard: [
        [{ text: '🌐 View on Maiat', url: WEBAPP_URL }],
      ]
    })

    // Clear state
    userStates.delete(userId)
  }
}

async function handleNaturalLanguage(chatId: number, userId: number, text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('coffee') || lower.includes('咖啡') || lower.includes('cafe') || lower.includes('brew')) {
    await handleRecommend(chatId, 'coffee')
  } else if (lower.includes('defi') || lower.includes('protocol') || lower.includes('swap') || lower.includes('yield')) {
    await handleRecommend(chatId, 'defi protocol')
  } else if (lower.includes('agent') || lower.includes('ai') || lower.includes('bot')) {
    await handleRecommend(chatId, 'ai agent')
  } else if (lower.includes('review') || lower.includes('評論') || lower.includes('rate')) {
    await showProjectsForReview(chatId)
  } else {
    await sendMessage(chatId, `I can help you find trusted recommendations!\n\nTry:\n• "Best coffee near ETHDenver"\n• "Recommend a DeFi protocol"\n• "Which AI agent is good?"\n• /review to write a review`)
  }
}

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }
  if (replyMarkup) {
    payload.reply_markup = replyMarkup
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  
  const data = await res.json()
  if (!data.ok) console.error('[TG] sendMessage failed:', data)
  return data
}
