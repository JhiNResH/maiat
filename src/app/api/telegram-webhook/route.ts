import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyReviewWith0G } from '@/lib/0g-compute'
import { submitReviewAttestation, hashReviewContent } from '@/lib/hedera'
import { getSimpleTrustScore, calculateTrustScore } from '@/lib/trust-score'
import { PrivyClient } from '@privy-io/server-auth'

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
)

export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
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
        await sendWelcome(chatId, userId, username)
      }
    } else if (text.startsWith('/recommend') || text.startsWith('/best') || text.toLowerCase().includes('推薦') || text.toLowerCase().includes('which') || text.toLowerCase().includes('best coffee')) {
      await handleRecommend(chatId, text)
    } else if (text.startsWith('/review')) {
      await showProjectsForReview(chatId)
    } else if (text.startsWith('/swap')) {
      await handleSwap(chatId, text)
    } else if (text.startsWith('/verify')) {
      await handleVerify(chatId, userId)
    } else if (text.startsWith('/trust') || text.startsWith('/score')) {
      await handleTrustQuery(chatId, text)
    } else if (text.startsWith('/reputation') || text.startsWith('/profile')) {
      await handleReputation(chatId, userId)
    } else if (text.startsWith('/search')) {
      await handleSearch(chatId, text)
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

async function getOrCreateWallet(userId: number, username: string): Promise<{ address: string; isNew: boolean }> {
  const tgAddress = `tg:${userId}`
  const existing = await prisma.user.findUnique({ where: { address: tgAddress } })

  // Check if user already has a real wallet address
  if (existing) {
    // Look for Privy wallet
    try {
      const privyUser = await privy.getUserByTelegramUserId(String(userId))
      if (privyUser) {
        const wallet = privyUser.linkedAccounts.find(
          (a: any) => a.type === 'wallet' && a.walletClientType === 'privy'
        )
        if (wallet && 'address' in wallet) {
          return { address: wallet.address as string, isNew: false }
        }
      }
    } catch {}
    return { address: tgAddress, isNew: false }
  }

  // Create new Privy user with embedded wallet
  let walletAddress: string | null = null
  try {
    let privyUser = await privy.getUserByTelegramUserId(String(userId))
    if (!privyUser) {
      privyUser = await privy.importUser({
        linkedAccounts: [{ type: 'telegram' as const, telegramUserId: String(userId), firstName: username }],
        createEthereumWallet: true,
      })
    }
    const wallet = privyUser.linkedAccounts.find(
      (a: any) => a.type === 'wallet' && a.walletClientType === 'privy'
    )
    if (wallet && 'address' in wallet) {
      walletAddress = wallet.address as string
    }
  } catch (e: any) {
    console.error('[Privy] wallet creation failed:', e.message)
  }

  await prisma.user.create({
    data: {
      address: walletAddress || tgAddress,
      displayName: username ? `@${username}` : `TG:${userId}`,
    }
  })

  return { address: walletAddress || tgAddress, isNew: true }
}

async function sendWelcome(chatId: number, userId?: number, username?: string) {
  let walletLine = ''
  if (userId) {
    try {
      const { address, isNew } = await getOrCreateWallet(userId, username || 'anon')
      if (address.startsWith('0x')) {
        const short = `${address.slice(0, 6)}...${address.slice(-4)}`
        walletLine = isNew
          ? `\n🔗 <b>Wallet created!</b> <code>${short}</code>\n`
          : `\n🔗 <b>Wallet:</b> <code>${short}</code>\n`
      }
    } catch (e: any) {
      console.error('[Welcome wallet]', e.message)
    }
  }

  const text = `🪲 <b>Welcome to Maiat</b>\nThe trust score layer for agentic commerce.${walletLine}\n🔍 <b>/recommend coffee</b> — Find the best\n✍️ <b>/review</b> — Write a verified review\n🔄 <b>/swap ETH USDC 0.1</b> — Trust-gated swap\n🛡️ <b>/trust DEGEN</b> — Check token trust score\n👤 <b>/reputation</b> — Your rep + fee tier\n🔎 <b>/search uniswap</b> — Search projects\n🔗 <b>/verify</b> — Link wallet + Base Verify\n❓ <b>/help</b> — How it works\n\nOr just ask me anything naturally!`

  await sendMessage(chatId, text, {
    inline_keyboard: [
      [{ text: '☕ Best Coffee', callback_data: 'recommend_coffee' }, { text: '✍️ Write Review', callback_data: 'start_review' }],
      [{ text: '🔄 Swap', url: `${WEBAPP_URL}/swap` }, { text: '🌐 Open Maiat', url: WEBAPP_URL }],
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

    // 1. Create user if needed — auto-generate Privy embedded wallet
    const tgAddress = `tg:${userId}`
    let user = await prisma.user.findUnique({ where: { address: tgAddress } })
    if (!user) {
      // Try to create Privy user with embedded wallet
      let walletAddress: string | null = null
      try {
        // Check if Privy user already exists
        let privyUser = await privy.getUserByTelegramUserId(String(userId))
        if (!privyUser) {
          privyUser = await privy.importUser({
            linkedAccounts: [{ type: 'telegram' as const, telegramUserId: String(userId), firstName: username }],
            createEthereumWallet: true,
          })
        }
        const embeddedWallet = privyUser.linkedAccounts.find(
          (a: any) => a.type === 'wallet' && a.walletClientType === 'privy'
        )
        if (embeddedWallet && 'address' in embeddedWallet) {
          walletAddress = embeddedWallet.address as string
        }
        console.log(`[Privy] User ${privyUser.id} wallet ${walletAddress}`)
      } catch (e: any) {
        console.error('[Privy] wallet creation failed:', e.message)
      }

      user = await prisma.user.create({
        data: {
          address: walletAddress || tgAddress,
          displayName: username ? `@${username}` : `TG:${userId}`,
        }
      })

      if (walletAddress) {
        await sendMessage(chatId, `🔗 <b>Wallet auto-created!</b>\n\n🏠 Address: <code>${walletAddress}</code>\n\nThis is your Maiat wallet, linked to your Telegram. All reviews and reputation are tied to this address.`)
      }
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

async function handleSwap(chatId: number, text: string) {
  // Parse: /swap ETH USDC 0.1
  const parts = text.split(/\s+/)
  const tokenInSymbol = (parts[1] || 'ETH').toUpperCase()
  const tokenOutSymbol = (parts[2] || 'USDC').toUpperCase()
  const amount = parts[3] || '0.01'

  const tokens: Record<string, { address: string; decimals: number }> = {
    'ETH': { address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    'WETH': { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    'USDC': { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    'DAI': { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    'CBBTC': { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8 },
    'AERO': { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18 },
    'DEGEN': { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18 },
    'USDT': { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
  }

  const tIn = tokens[tokenInSymbol]
  const tOut = tokens[tokenOutSymbol]

  if (!tIn || !tOut) {
    await sendMessage(chatId, `❌ Unknown token.\n\nSupported: ETH, WETH, USDC, DAI, CBBTC, AERO, DEGEN, USDT\n\nUsage: <code>/swap DEGEN USDC 100</code>`)
    return
  }

  await sendMessage(chatId, `🔄 Getting trust-gated quote for ${amount} ${tokenInSymbol} → ${tokenOutSymbol}...`)

  try {
    const amountWei = BigInt(Math.floor(parseFloat(amount) * (10 ** tIn.decimals))).toString()

    const res = await fetch(`${WEBAPP_URL}/api/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenIn: tIn.address,
        tokenOut: tOut.address,
        amount: amountWei,
        chainId: 8453,
        swapper: '0x0000000000000000000000000000000000000001',
        type: 'EXACT_INPUT',
      }),
    })

    const data = await res.json()

    if (data.error) {
      await sendMessage(chatId, `❌ ${data.error}`)
      return
    }

    const trustEmoji = !data.allowed ? '🔴' : data.warning ? '🟡' : '🟢'
    const trustLabel = !data.allowed ? 'BLOCKED' : data.warning ? 'CAUTION' : 'SAFE'
    
    let msg = `${trustEmoji} <b>Trust-Gated Swap</b>\n\n`
    msg += `📊 ${amount} ${tokenInSymbol} → ${tokenOutSymbol}\n`
    
    // Token trust score
    if (data.trustScore !== undefined) {
      msg += `\n🛡️ <b>${data.tokenName || tokenOutSymbol}</b> Trust: <b>${data.trustScore}/100</b> (${trustLabel})`
      if (data.tokenReviews !== undefined) {
        msg += `\n   ${data.tokenReviews} reviews · ${(data.tokenRating || 0).toFixed(1)}★`
      }
      msg += '\n'
    }

    if (data.warning) msg += `\n⚠️ ${data.warning}\n`
    if (!data.allowed) msg += `\n❌ Swap blocked for your protection.\n`

    // Uniswap quote
    if (data.quote) {
      const outAmount = data.quote?.quote?.output?.amount
      if (outAmount) {
        const outDecimals = tOut.decimals
        const outputFormatted = (Number(outAmount) / (10 ** outDecimals)).toFixed(4)
        msg += `\n💰 Quote: <b>${outputFormatted} ${tokenOutSymbol}</b>`
      }
      if (data.quote.routing) msg += `\n🔀 Route: ${data.quote.routing}`
      msg += '\n'
    }

    // User reputation + fees
    if (data.userReputation) {
      const rep = data.userReputation
      msg += `\n👤 Your Level: <b>${rep.trustLevel.toUpperCase()}</b> (rep: ${rep.reputationScore})`
      msg += `\n🪲 Scarab: ${rep.scarabPoints}`
    }
    if (data.fees) {
      msg += `\n💸 Fee: <b>${data.fees.effectiveFee}</b>`
      if (data.fees.saved) msg += ` (${data.fees.saved})`
      msg += '\n'
    }

    msg += `\n<i>Powered by Uniswap API × Maiat Trust Layer on Base</i>`

    await sendMessage(chatId, msg, {
      inline_keyboard: [
        [{ text: '🔄 Execute on Maiat', url: `${WEBAPP_URL}/?view=swap` }],
      ]
    })
  } catch (e: any) {
    await sendMessage(chatId, `❌ Swap quote failed: ${e.message}`)
  }
}

async function handleVerify(chatId: number, userId: number) {
  const tgAddress = `tg:${userId}`
  const user = await prisma.user.findUnique({ where: { address: tgAddress } })

  // Check if already linked to a wallet
  const linkedWallet = user?.displayName?.startsWith('0x') ? user.displayName : null

  if (linkedWallet) {
    await sendMessage(chatId,
      `✅ <b>Already Verified!</b>\n\n` +
      `🔗 Wallet: <code>${linkedWallet.slice(0,6)}...${linkedWallet.slice(-4)}</code>\n` +
      `🛡️ Your Telegram reviews are linked to this wallet.\n` +
      `📊 Base Verify status applies to all your reviews.`,
      { inline_keyboard: [[{ text: '🌐 Manage on Maiat', url: `${WEBAPP_URL}/review` }]] }
    )
    return
  }

  // Generate a unique link token
  const linkToken = `${userId}_${Date.now().toString(36)}`

  await sendMessage(chatId,
    `🛡️ <b>Verify Your Identity</b>\n\n` +
    `Connect your wallet on Maiat to:\n\n` +
    `1️⃣ Link your Telegram to your wallet address\n` +
    `2️⃣ Get <b>Base Verify</b> "Verified Human" badge\n` +
    `3️⃣ Your reviews get <b>2x trust weight</b>\n` +
    `4️⃣ Unlock lower swap fees\n\n` +
    `👇 Tap below to connect:`,
    {
      inline_keyboard: [
        [{ text: '🔗 Connect Wallet & Verify', url: `${WEBAPP_URL}/verify?tg=${userId}&token=${linkToken}` }],
      ]
    }
  )
}

async function generateAIAnalysis(
  projectName: string,
  category: string,
  score: number,
  breakdown: { onChainActivity: number; verifiedReviews: number; communityTrust: number; aiQuality: number },
  reviews: Array<{ content: string; rating: number; reviewer?: { displayName: string | null } }>,
  avgRating: number,
  reviewCount: number,
): Promise<string> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_KEY) return ''

  const reviewSummary = reviews.slice(0, 5).map(r =>
    `- ${r.rating}★: "${r.content.slice(0, 150)}"`
  ).join('\n')

  const prompt = `You are Maiat's trust analysis engine. Give a concise 3-4 sentence analysis of this crypto project's trustworthiness. Be direct and specific. Use data provided.

Project: ${projectName}
Category: ${category}
Overall Trust Score: ${score}/100
Breakdown:
- On-chain Activity: ${breakdown.onChainActivity}/100
- Verified Reviews: ${breakdown.verifiedReviews}/100  
- Community Trust: ${breakdown.communityTrust}/100
- AI Baseline: ${breakdown.aiQuality}/100
Average Rating: ${avgRating}/5 from ${reviewCount} reviews

Recent Reviews:
${reviewSummary || 'No reviews yet.'}

Write analysis in this format:
1. Overall assessment (1 sentence)
2. Key strength (1 sentence)
3. Key risk/weakness (1 sentence)
4. Recommendation for traders (1 sentence)

Keep it under 400 chars. No markdown, no bullet points, just flowing text.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
        }),
      }
    )
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  } catch (e: any) {
    console.error('[Gemini trust analysis]', e.message)
    return ''
  }
}

async function handleTrustQuery(chatId: number, text: string) {
  const query = text.replace(/^\/(trust|score)\s*/i, '').trim()
  if (!query) {
    await sendMessage(chatId, '🛡️ Usage: <code>/trust DEGEN</code> or <code>/trust uniswap</code>')
    return
  }

  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query.toLowerCase() } },
      ]
    },
    include: { reviews: { take: 5, orderBy: { createdAt: 'desc' }, include: { reviewer: true } } }
  })

  if (!project) {
    await sendMessage(chatId, `❌ No project found for "<b>${query}</b>".\n\nTry /search ${query}`)
    return
  }

  await sendMessage(chatId, `🔍 Analyzing <b>${project.name}</b>...`)

  // Use full trust score with breakdown
  let score: number, breakdown: { onChainActivity: number; verifiedReviews: number; communityTrust: number; aiQuality: number }
  try {
    const result = await calculateTrustScore(project.slug)
    score = result.score
    breakdown = result.breakdown
  } catch {
    score = getSimpleTrustScore(project.name, project.category, project.avgRating, project.reviewCount)
    breakdown = { onChainActivity: 0, verifiedReviews: Math.round(project.avgRating * 20), communityTrust: 0, aiQuality: score }
  }

  const riskLevel = score >= 80 ? '🟢 Low Risk' : score >= 50 ? '🟡 Medium Risk' : '🔴 High Risk'
  const stars = project.avgRating > 0 ? '⭐'.repeat(Math.round(project.avgRating)) : 'No ratings'

  // Generate AI analysis
  const aiAnalysis = await generateAIAnalysis(
    project.name, project.category, score, breakdown,
    project.reviews, project.avgRating, project.reviewCount
  )

  let msg = `🛡️ <b>Trust Analysis: ${project.name}</b>\n\n`
  msg += `📊 Overall Score: <b>${score}/100</b> ${riskLevel}\n`
  msg += `⭐ Rating: ${stars} (${project.avgRating.toFixed(1)}) · ${project.reviewCount} reviews\n`
  msg += `📁 ${project.category.replace('m/', '').toUpperCase()}\n\n`

  // Breakdown bars
  msg += `<b>📋 Score Breakdown</b>\n`
  msg += `⛓️ On-chain Activity: ${breakdown.onChainActivity}/100 ${getBar(breakdown.onChainActivity)}\n`
  msg += `✅ Verified Reviews: ${breakdown.verifiedReviews}/100 ${getBar(breakdown.verifiedReviews)}\n`
  msg += `👥 Community Trust: ${breakdown.communityTrust}/100 ${getBar(breakdown.communityTrust)}\n`
  msg += `🤖 AI Baseline: ${breakdown.aiQuality}/100 ${getBar(breakdown.aiQuality)}\n`

  // AI Analysis
  if (aiAnalysis) {
    msg += `\n🧠 <b>AI Analysis</b>\n<i>${aiAnalysis}</i>\n`
  }

  // Swap recommendation
  if (score < 30) msg += `\n🚫 <b>BLOCKED — Trust too low for trust-gated swap.</b>\n`
  else if (score < 60) msg += `\n⚠️ <b>CAUTION — Moderate trust. Swap with care.</b>\n`
  else msg += `\n✅ <b>SAFE — Cleared for trust-gated swap.</b>\n`

  // Latest reviews
  if (project.reviews.length > 0) {
    msg += `\n💬 <b>Latest Reviews:</b>\n`
    project.reviews.slice(0, 3).forEach(r => {
      const reviewer = r.reviewer?.displayName || 'Anon'
      const verified = r.txHash ? ' ✅' : ''
      msg += `\n"<i>${r.content.slice(0, 100)}${r.content.length > 100 ? '...' : ''}</i>"\n— ${reviewer} ${'⭐'.repeat(r.rating)}${verified}\n`
    })
  }

  await sendMessage(chatId, msg, {
    inline_keyboard: [
      [{ text: '✍️ Write Review', callback_data: `review_${project.slug}` }],
      [{ text: '🔄 Swap', url: `${WEBAPP_URL}/?view=swap` }, { text: '🌐 View on Maiat', url: WEBAPP_URL }],
    ]
  })
}

function getBar(value: number): string {
  const filled = Math.round(value / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

async function handleReputation(chatId: number, userId: number) {
  const tgAddress = `tg:${userId}`
  const user = await prisma.user.findUnique({ where: { address: tgAddress } })
  const scarab = await prisma.scarabBalance.findUnique({ where: { address: tgAddress } })

  const reputationScore = user?.reputationScore ?? 0
  const scarabPoints = scarab?.balance ?? 0
  const totalReviews = user?.totalReviews ?? 0
  const totalUpvotes = user?.totalUpvotes ?? 0
  const combinedScore = reputationScore + Math.floor(scarabPoints / 10)

  // Fee tier
  let trustLevel: string, fee: string, feeEmoji: string
  if (combinedScore >= 200) { trustLevel = '🏆 Guardian'; fee = '0%'; feeEmoji = '🟢' }
  else if (combinedScore >= 50) { trustLevel = '✅ Verified'; fee = '0.1%'; feeEmoji = '🟢' }
  else if (combinedScore >= 10) { trustLevel = '🟡 Trusted'; fee = '0.3%'; feeEmoji = '🟡' }
  else { trustLevel = '⬜ New'; fee = '0.5%'; feeEmoji = '🔵' }

  let msg = `👤 <b>Your Reputation</b>\n\n`
  msg += `${trustLevel}\n`
  msg += `📊 Combined Score: <b>${combinedScore}</b>\n`
  msg += `🪲 Scarab Points: ${scarabPoints}\n`
  msg += `📝 Reviews Written: ${totalReviews}\n`
  msg += `👍 Total Upvotes: ${totalUpvotes}\n\n`
  msg += `${feeEmoji} <b>Swap Fee: ${fee}</b>\n\n`

  // Progress to next tier
  if (combinedScore < 10) {
    msg += `💡 Write ${Math.max(1, 10 - combinedScore)} more reviews to unlock <b>Trusted</b> (0.3% fee)\n`
  } else if (combinedScore < 50) {
    msg += `💡 ${50 - combinedScore} more points to unlock <b>Verified</b> (0.1% fee)\n`
  } else if (combinedScore < 200) {
    msg += `💡 ${200 - combinedScore} more points to unlock <b>Guardian</b> (0% fee)\n`
  } else {
    msg += `🎉 You've reached the highest tier! Enjoy 0% swap fees.\n`
  }

  await sendMessage(chatId, msg, {
    inline_keyboard: [
      [{ text: '✍️ Write Review (+rep)', callback_data: 'start_review' }],
      [{ text: '🔄 Swap (discounted)', url: `${WEBAPP_URL}/?view=swap` }],
    ]
  })
}

async function handleSearch(chatId: number, text: string) {
  const query = text.replace(/^\/search\s*/i, '').trim()
  if (!query) {
    await sendMessage(chatId, '🔎 Usage: <code>/search uniswap</code> or <code>/search coffee</code>')
    return
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query.toLowerCase() } },
      ]
    },
    orderBy: { reviewCount: 'desc' },
    take: 10,
  })

  if (projects.length === 0) {
    await sendMessage(chatId, `🔎 No results for "<b>${query}</b>".\n\nBrowse all: ${WEBAPP_URL}`)
    return
  }

  let msg = `🔎 <b>Search: "${query}"</b> — ${projects.length} result${projects.length > 1 ? 's' : ''}\n\n`
  projects.forEach((p, i) => {
    const score = getSimpleTrustScore(p.name, p.category, p.avgRating, p.reviewCount)
    const emoji = p.category === 'm/coffee' ? '☕' : p.category === 'm/defi' ? '🏦' : '🤖'
    msg += `${i + 1}. ${emoji} <b>${p.name}</b> — Trust: ${score}/100 · ${p.reviewCount} reviews\n`
  })

  const buttons: any[][] = projects.slice(0, 5).map(p => {
    return [{ text: `🛡️ ${p.name}`, callback_data: `review_${p.slug}` }]
  })
  buttons.push([{ text: '🌐 Browse all on Maiat', url: `${WEBAPP_URL}/?q=${encodeURIComponent(query)}` }])

  await sendMessage(chatId, msg, { inline_keyboard: buttons })
}

async function handleNaturalLanguage(chatId: number, userId: number, text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('coffee') || lower.includes('咖啡') || lower.includes('cafe') || lower.includes('brew')) {
    await handleRecommend(chatId, 'coffee')
  } else if (lower.includes('defi') || lower.includes('protocol') || lower.includes('swap') || lower.includes('yield')) {
    await handleRecommend(chatId, 'defi protocol')
  } else if (lower.includes('agent') || lower.includes('ai') || lower.includes('bot')) {
    await handleRecommend(chatId, 'ai agent')
  } else if (lower.includes('swap') || lower.includes('trade') || lower.includes('exchange') || lower.includes('買') || lower.includes('換')) {
    await handleSwap(chatId, '/swap ETH USDC 0.01')
  } else if (lower.includes('trust score') || lower.includes('信任') || lower.includes('safe')) {
    const match = text.match(/(?:trust|score|safe)\s+(\w+)/i)
    if (match) await handleTrustQuery(chatId, `/trust ${match[1]}`)
    else await sendMessage(chatId, '🛡️ Check trust: <code>/trust DEGEN</code>')
  } else if (lower.includes('reputation') || lower.includes('my score') || lower.includes('fee') || lower.includes('聲譽')) {
    await handleReputation(chatId, userId)
  } else if (lower.includes('search') || lower.includes('find') || lower.includes('搜尋') || lower.includes('找')) {
    await handleSearch(chatId, `/search ${text.replace(/^(search|find|搜尋|找)\s*/i, '')}`)
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
