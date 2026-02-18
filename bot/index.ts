/**
 * Maiat Telegram Bot
 * 
 * Core entry point for collecting reviews and serving trust scores.
 * Users interact via Telegram, agents interact via API.
 * 
 * Commands:
 *   /start          - Welcome + register
 *   /review <name>  - Start review flow for a project
 *   /score <name>   - Get trust score for a project
 *   /search <query> - Search projects
 *   /myscarab       - Check Scarab balance
 *   /help           - Show commands
 */

import { Bot, Context, session, SessionFlavor, InlineKeyboard } from 'grammy'
import { PrismaClient } from '@prisma/client'
import { analyzeReview } from './analyze'
import { getOrCreateWallet } from './privy'

// Session data for multi-step review flow
interface SessionData {
  step: 'idle' | 'awaiting_rating' | 'awaiting_review'
  projectId?: string
  projectName?: string
  rating?: number
}

type BotContext = Context & SessionFlavor<SessionData>

const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN!)
const prisma = new PrismaClient()

// Session middleware
bot.use(session({
  initial: (): SessionData => ({ step: 'idle' }),
}))

// ==========================================
// /start - Welcome & Register
// ==========================================
bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id?.toString()
  if (!telegramId) return

  // Check for deep link: /start review_AIXBT
  const payload = ctx.match
  
  // Get or create Privy wallet for this user
  const displayName = ctx.from?.first_name || ctx.from?.username || `User ${telegramId.slice(-4)}`
  const wallet = await getOrCreateWallet(telegramId, displayName)
  
  // Ensure user exists in DB with wallet address
  const address = wallet?.walletAddress || `tg:${telegramId}`
  let user = await prisma.user.findUnique({ where: { address } })
  if (!user) {
    // Also check old tg: format
    user = await prisma.user.findUnique({ where: { address: `tg:${telegramId}` } })
    if (user && wallet?.walletAddress) {
      // Upgrade to real wallet address
      await prisma.user.update({ where: { id: user.id }, data: { address: wallet.walletAddress } })
    } else if (!user) {
      user = await prisma.user.create({ data: { address, displayName } })
    }
  }

  const walletLine = wallet?.walletAddress 
    ? `\n🔑 Your wallet: \`${wallet.walletAddress.slice(0, 6)}...${wallet.walletAddress.slice(-4)}\`` 
    : ''

  const welcome = `🪲 *Welcome to Maiat*

The trust score layer for crypto & AI agents.${walletLine}

*What you can do:*
/review <project> — Rate a project
/score <project> — Check trust score
/search <query> — Find projects
/myscarab — Check your Scarab balance
/wallet — View your wallet address

_Every review makes the ecosystem safer._`

  await ctx.reply(welcome, { parse_mode: 'Markdown' })

  // Handle deep link for review
  if (payload && payload.startsWith('review_')) {
    const projectName = payload.replace('review_', '').replace(/_/g, ' ')
    await startReviewFlow(ctx, projectName)
  }
})

// ==========================================
// /review <project> - Start Review Flow
// ==========================================
bot.command('review', async (ctx) => {
  const projectName = ctx.match?.trim()
  if (!projectName) {
    await ctx.reply('Usage: /review <project name>\n\nExample: /review AIXBT')
    return
  }
  await startReviewFlow(ctx, projectName)
})

async function startReviewFlow(ctx: BotContext, projectName: string) {
  // Search for project
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { name: { contains: projectName, mode: 'insensitive' } },
        { address: { contains: projectName, mode: 'insensitive' } },
      ]
    }
  })

  if (!project) {
    await ctx.reply(`❌ Project "${projectName}" not found.\n\nTry /search ${projectName} to find it.`)
    return
  }

  // Set session for multi-step flow
  ctx.session.step = 'awaiting_rating'
  ctx.session.projectId = project.id
  ctx.session.projectName = project.name

  const keyboard = new InlineKeyboard()
    .text('⭐ 1', 'rate_1')
    .text('⭐ 2', 'rate_2')
    .text('⭐ 3', 'rate_3')
    .text('⭐ 4', 'rate_4')
    .text('⭐ 5', 'rate_5')

  await ctx.reply(
    `📝 *Review: ${project.name}*\n\nHow would you rate this project? (1-5)`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
}

// Handle rating button clicks
bot.callbackQuery(/^rate_(\d)$/, async (ctx) => {
  const rating = parseInt(ctx.match![1])
  
  if (ctx.session.step !== 'awaiting_rating' || !ctx.session.projectId) {
    await ctx.answerCallbackQuery('Session expired. Start again with /review')
    return
  }

  ctx.session.rating = rating
  ctx.session.step = 'awaiting_review'

  await ctx.answerCallbackQuery(`Rating: ${rating}/5`)
  await ctx.editMessageText(
    `📝 *Review: ${ctx.session.projectName}*\nRating: ${'⭐'.repeat(rating)}\n\nNow write a short review (one sentence is fine):`,
    { parse_mode: 'Markdown' }
  )
})

// Handle review text (free text when in awaiting_review state)
bot.on('message:text', async (ctx) => {
  // Only process if we're awaiting a review
  if (ctx.session.step !== 'awaiting_review') return
  if (!ctx.session.projectId || !ctx.session.rating) return

  const content = ctx.message.text
  const telegramId = ctx.from?.id?.toString()
  if (!telegramId) return

  try {
    // AI quality check
    await ctx.reply('🔍 Analyzing your review...')
    const analysis = await analyzeReview(
      ctx.session.projectName || 'Unknown',
      ctx.session.rating,
      content
    )

    if (analysis.quality === 'spam' || analysis.score < 20) {
      ctx.session.step = 'idle'
      await ctx.reply(
        `❌ Review rejected: ${analysis.reason}\n\nPlease write a more specific review about your experience.`
      )
      return
    }

    // Get or create user by telegram ID
    const address = `tg:${telegramId}`
    let user = await prisma.user.findUnique({ where: { address } })
    if (!user) {
      const displayName = ctx.from?.first_name || ctx.from?.username || `User ${telegramId.slice(-4)}`
      user = await prisma.user.create({
        data: { address, displayName }
      })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: ctx.session.rating,
        content,
        status: 'active',
        reviewerId: user.id,
        projectId: ctx.session.projectId,
      }
    })

    // Update project stats
    const reviews = await prisma.review.findMany({
      where: { projectId: ctx.session.projectId }
    })
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    await prisma.project.update({
      where: { id: ctx.session.projectId },
      data: {
        avgRating: Math.round(avg * 10) / 10,
        reviewCount: reviews.length,
      }
    })

    // Update user stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalReviews: { increment: 1 },
        reputationScore: { increment: 10 },
      }
    })

    // Award Scarab
    const scarabReward = 5
    await prisma.scarabBalance.upsert({
      where: { address },
      create: {
        address,
        balance: scarabReward,
        totalEarned: scarabReward,
      },
      update: {
        balance: { increment: scarabReward },
        totalEarned: { increment: scarabReward },
      }
    })

    const projectName = ctx.session.projectName || 'Project'

    // Reset session
    ctx.session.step = 'idle'
    ctx.session.projectId = undefined
    ctx.session.projectName = undefined
    ctx.session.rating = undefined

    const qualityEmoji = analysis.quality === 'high' ? '🟢' : analysis.quality === 'medium' ? '🟡' : '🔴'

    await ctx.reply(
      `✅ *Review submitted!*\n\n` +
      `Project: ${projectName}\n` +
      `Rating: ${'⭐'.repeat(review.rating)}\n` +
      `Review: "${content}"\n` +
      `Quality: ${qualityEmoji} ${analysis.score}/100\n\n` +
      `🪲 +${scarabReward} Scarab earned!\n\n` +
      `_${analysis.reason}_`,
      { parse_mode: 'Markdown' }
    )

  } catch (error) {
    console.error('Review submission error:', error)
    await ctx.reply('❌ Failed to submit review. Please try again.')
    ctx.session.step = 'idle'
  }
})

// ==========================================
// /score <project> - Get Trust Score
// ==========================================
bot.command('score', async (ctx) => {
  const projectName = ctx.match?.trim()
  if (!projectName) {
    await ctx.reply('Usage: /score <project name>\n\nExample: /score AIXBT')
    return
  }

  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { name: { contains: projectName, mode: 'insensitive' } },
        { address: { contains: projectName, mode: 'insensitive' } },
      ]
    },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { reviewer: { select: { displayName: true } } }
      }
    }
  })

  if (!project) {
    await ctx.reply(`❌ Project "${projectName}" not found.`)
    return
  }

  // Calculate trust score (0-100)
  const trustScore = Math.round(project.avgRating * 20)
  const scoreEmoji = trustScore >= 80 ? '🟢' : trustScore >= 50 ? '🟡' : '🔴'

  let msg = `${scoreEmoji} *${project.name}*\n\n`
  msg += `Trust Score: *${trustScore}/100*\n`
  msg += `Avg Rating: ${'⭐'.repeat(Math.round(project.avgRating))} (${project.avgRating.toFixed(1)})\n`
  msg += `Reviews: ${project.reviewCount}\n`
  msg += `Category: ${project.category}\n`

  if (project.reviews.length > 0) {
    msg += `\n📝 *Latest reviews:*\n`
    for (const r of project.reviews) {
      msg += `• ${'⭐'.repeat(r.rating)} — "${r.content.slice(0, 80)}${r.content.length > 80 ? '...' : ''}" — _${r.reviewer.displayName}_\n`
    }
  }

  msg += `\n💬 /review ${project.name} to add yours`

  await ctx.reply(msg, { parse_mode: 'Markdown' })
})

// ==========================================
// /search <query> - Search Projects
// ==========================================
bot.command('search', async (ctx) => {
  const query = ctx.match?.trim()
  if (!query) {
    await ctx.reply('Usage: /search <query>\n\nExample: /search AI agent')
    return
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ]
    },
    take: 10,
    orderBy: { reviewCount: 'desc' },
  })

  if (projects.length === 0) {
    await ctx.reply(`No projects found for "${query}".`)
    return
  }

  let msg = `🔍 *Search: "${query}"*\n\n`
  for (const p of projects) {
    const score = Math.round(p.avgRating * 20)
    const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
    msg += `${emoji} *${p.name}* — ${score}/100 (${p.reviewCount} reviews)\n`
  }
  msg += `\nUse /score <name> for details`

  await ctx.reply(msg, { parse_mode: 'Markdown' })
})

// ==========================================
// /myscarab - Check Balance
// ==========================================
bot.command('myscarab', async (ctx) => {
  const telegramId = ctx.from?.id?.toString()
  if (!telegramId) return

  const address = `tg:${telegramId}`
  const balance = await prisma.scarabBalance.findUnique({ where: { address } })

  if (!balance) {
    await ctx.reply('🪲 You have 0 Scarab.\n\nWrite reviews to earn Scarab!')
    return
  }

  await ctx.reply(
    `🪲 *Your Scarab Balance*\n\n` +
    `Balance: *${balance.balance}* 🪲\n` +
    `Total Earned: ${balance.totalEarned}\n` +
    `Total Spent: ${balance.totalSpent}\n\n` +
    `_Write reviews to earn more!_`,
    { parse_mode: 'Markdown' }
  )
})

// ==========================================
// /wallet - View wallet address
// ==========================================
bot.command('wallet', async (ctx) => {
  const telegramId = ctx.from?.id?.toString()
  if (!telegramId) return

  const wallet = await getOrCreateWallet(telegramId, ctx.from?.first_name)
  if (wallet?.walletAddress) {
    await ctx.reply(
      `🔑 *Your Maiat Wallet*\n\n` +
      `Address: \`${wallet.walletAddress}\`\n` +
      `Chain: Base\n\n` +
      `_This is your embedded wallet powered by Privy. Your reviews are signed with this wallet._`,
      { parse_mode: 'Markdown' }
    )
  } else {
    await ctx.reply('❌ Could not create wallet. Please try again later.')
  }
})

// ==========================================
// /help
// ==========================================
bot.command('help', async (ctx) => {
  await ctx.reply(
    `🪲 *Maiat Commands*\n\n` +
    `/review <project> — Write a review\n` +
    `/score <project> — Check trust score\n` +
    `/search <query> — Find projects\n` +
    `/myscarab — Check Scarab balance\n` +
    `/help — Show this message\n\n` +
    `_Maiat is the trust score layer for crypto & AI agents._`,
    { parse_mode: 'Markdown' }
  )
})

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err)
})

// Start
console.log('🪲 Maiat Bot starting...')
bot.start()
console.log('🪲 Maiat Bot is running!')
