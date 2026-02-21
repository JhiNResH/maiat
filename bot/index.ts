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
 *   /demo_purchase  - (hidden) Simulate payment detection for live demo
 *   /ask <question> - Natural language query ("best coffee?")
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
  
  const displayName = ctx.from?.first_name || ctx.from?.username || `User ${telegramId.slice(-4)}`
  
  // Try Privy wallet (non-blocking)
  let walletAddress: string | null = null
  try {
    const wallet = await getOrCreateWallet(telegramId, displayName)
    walletAddress = wallet?.walletAddress || null
  } catch (e) {
    console.log('Privy skipped:', (e as Error).message?.slice(0, 80))
  }
  
  // Ensure user exists in DB
  const address = walletAddress || `tg:${telegramId}`
  let user = await prisma.user.findUnique({ where: { address } })
  if (!user) {
    user = await prisma.user.findUnique({ where: { address: `tg:${telegramId}` } })
    if (user && walletAddress) {
      await prisma.user.update({ where: { id: user.id }, data: { address: walletAddress } })
    } else if (!user) {
      user = await prisma.user.create({ data: { address, displayName } })
    }
  }

  const walletLine = walletAddress 
    ? `\n🔑 Your wallet: \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\`` 
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
        take: 10,
        include: { reviewer: { select: { displayName: true } } }
      }
    }
  })

  if (!project) {
    await ctx.reply(`❌ Project "${projectName}" not found.\n\nTry /search ${projectName}`)
    return
  }

  // Calculate trust score (0-100)
  const trustScore = Math.round(project.avgRating * 20)
  const scoreEmoji = trustScore >= 80 ? '🟢' : trustScore >= 50 ? '🟡' : '🔴'
  const risk = trustScore >= 80 ? 'Low' : trustScore >= 50 ? 'Medium' : 'High'
  const cat = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : project.category

  // Generate AI summary
  await ctx.reply('🔍 Generating AI analysis...', { parse_mode: 'Markdown' })
  
  let aiSummary = ''
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const type = project.category === 'm/ai-agents' ? 'AI agent' : 'DeFi protocol'
    const context = [
      `Project: ${project.name} (${type})`,
      project.description ? `Description: ${project.description}` : '',
      project.website ? `Website: ${project.website}` : '',
      project.address ? `Contract: ${project.address}` : '',
    ].filter(Boolean).join('\n')

    let prompt: string
    if (project.reviews.length === 0) {
      prompt = `You are a crypto/DeFi analyst. Based on this project info, give a trust assessment in 2-3 sentences. Cover: what it does, strengths, risks. Be specific.\n\n${context}`
    } else {
      const reviewTexts = project.reviews.map(r => `${r.rating}/5: "${r.content}"`).join('\n')
      prompt = `You are a crypto analyst. Summarize these reviews of "${project.name}" in 2-3 sentences. Be objective. Mention strengths and concerns.\n\n${context}\n\nReviews:\n${reviewTexts}`
    }
    
    const result = await model.generateContent(prompt)
    aiSummary = result.response.text()
  } catch (e) {
    aiSummary = 'AI analysis temporarily unavailable.'
  }

  let msg = `${scoreEmoji} *${project.name}*\n\n`
  msg += `📊 *Trust Score: ${trustScore}/100*\n`
  msg += `⭐ Rating: ${project.avgRating.toFixed(1)}/5 (${project.reviewCount} reviews)\n`
  msg += `🏷 Category: ${cat}\n`
  msg += `⚠️ Risk Level: ${risk}\n`
  if (project.website) msg += `🌐 ${project.website}\n`
  if (project.address) msg += `📝 Contract: \`${project.address.slice(0, 10)}...${project.address.slice(-6)}\`\n`
  
  msg += `\n🤖 *AI Analysis:*\n_${aiSummary}_\n`
  
  if (project.reviews.length > 0) {
    msg += `\n📝 *Latest Reviews:*\n`
    for (const r of project.reviews.slice(0, 3)) {
      const stars = '⭐'.repeat(r.rating)
      const text = r.content.length > 60 ? r.content.slice(0, 57) + '...' : r.content
      const author = r.reviewer.displayName || 'Anon'
      msg += `• ${stars} "${text}" — _${author}_\n`
    }
  }
  
  msg += `\n💬 /review ${project.name} — Add your review`

  const keyboard = new InlineKeyboard().text('📝 Write Review', `review_${project.name}`)
  await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard })
})

// ==========================================
// /search <query> - Search Projects
// ==========================================
bot.command('search', async (ctx) => {
  const query = ctx.match?.trim()
  if (!query) {
    // Show category browse buttons
    const keyboard = new InlineKeyboard()
      .text('🤖 AI Agents', 'browse_ai-agents')
      .text('💰 DeFi', 'browse_defi')
    await ctx.reply('🔍 *Search Maiat*\n\nChoose a category or type:\n`/search <project name>`', { 
      parse_mode: 'Markdown', 
      reply_markup: keyboard 
    })
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
    // Auto-discover from CoinGecko/DeFiLlama
    await ctx.reply(`🔍 "${query}" not in database, searching CoinGecko/DeFiLlama...`)
    try {
      const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}&auto=true`)
      if (res.ok) {
        const data = await res.json()
        if (data.projects?.length > 0) {
          const p = data.projects[0]
          const cat = p.category === 'm/ai-agents' ? 'AI Agent' : 'DeFi'
          let msg = `✅ *Found: ${p.name}*\n\n`
          msg += `🏷 Category: ${cat}\n`
          if (p.website) msg += `🌐 ${p.website}\n`
          if (p.description) msg += `\n_${p.description.slice(0, 200)}_\n`
          msg += `\n📝 /review ${p.name} — Be the first to review!`
          
          const keyboard = new InlineKeyboard()
            .text('📝 Write Review', `review_${p.name}`)
          
          await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard })
          return
        }
      }
    } catch (err) {
      console.error('[Bot] Auto-discover failed:', err)
    }
    await ctx.reply(`❌ "${query}" not found on CoinGecko or DeFiLlama either.\n\nTry a different name or token symbol.`)
    return
  }

  // If single exact match, show detailed score directly
  const exactMatch = projects.find(p => p.name.toLowerCase() === query.toLowerCase())
  if (exactMatch || projects.length === 1) {
    const p = exactMatch || projects[0]
    const score = Math.round(p.avgRating * 20)
    const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
    const risk = score >= 80 ? 'Low' : score >= 50 ? 'Medium' : 'High'
    const cat = p.category === 'm/ai-agents' ? 'AI Agent' : 'DeFi'
    
    let msg = `${emoji} *${p.name}*\n\n`
    msg += `📊 Trust Score: *${score}/100*\n`
    msg += `⭐ Rating: ${p.avgRating.toFixed(1)}/5 (${p.reviewCount} reviews)\n`
    msg += `🏷 Category: ${cat}\n`
    msg += `⚠️ Risk: ${risk}\n`
    msg += `📝 Contract: \`${p.address.slice(0, 10)}...${p.address.slice(-6)}\`\n`
    if (p.website) msg += `🌐 ${p.website}\n`
    if (p.description) msg += `\n_${p.description.slice(0, 200)}_\n`
    msg += `\n💬 /review ${p.name} — Write a review`

    const keyboard = new InlineKeyboard()
      .text('📝 Write Review', `review_${p.name}`)
      .text('🔍 More Details', `score_${p.name}`)

    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard })
    return
  }

  let msg = `🔍 *Search: "${query}"* (${projects.length} results)\n\n`
  const keyboard = new InlineKeyboard()
  for (const p of projects) {
    const score = Math.round(p.avgRating * 20)
    const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
    msg += `${emoji} *${p.name}* — ${score}/100 (${p.reviewCount} reviews)\n`
    keyboard.text(`${p.name}`, `score_${p.name}`).row()
  }

  await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard })
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

// ==========================================
// /demo_purchase - Hidden demo trigger
// Simulates "payment detected" for live demos
// ==========================================
bot.command('demo_purchase', async (ctx) => {
  const merchantName = ctx.match?.trim() || "Jerry's Coffee"

  // Delete the command so audience doesn't see it
  try { await ctx.deleteMessage() } catch {}

  // Find or create a demo project
  let project = await prisma.project.findFirst({
    where: { name: { contains: merchantName, mode: 'insensitive' } }
  })

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: merchantName,
        slug: merchantName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        address: `0xdemo${Date.now().toString(16)}`,
        category: 'm/defi',
        description: `${merchantName} — verified merchant on Base`,
        avgRating: 0,
        reviewCount: 0,
      }
    })
  }

  // Set session to awaiting review for this project
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
    `☕ *Payment detected on Base!*\n\n` +
    `Looks like you just visited *${project.name}*.\n` +
    `How was your experience? Rate it below, then send a voice message or text review.\n\n` +
    `_Tx: 0x${Buffer.from(Date.now().toString()).toString('hex').slice(0, 12)}...on Base_`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
})

// ==========================================
// /ask <question> - Natural language query
// "Where's the best coffee?" / "What's trustworthy?"
// ==========================================
bot.command('ask', async (ctx) => {
  const question = ctx.match?.trim()
  if (!question) {
    await ctx.reply('Usage: /ask <question>\n\nExample: /ask best coffee nearby')
    return
  }

  await ctx.reply('🔍 Searching Maiat trust database...')

  // Get all projects with reviews
  const projects = await prisma.project.findMany({
    where: { reviewCount: { gt: 0 } },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { reviewer: { select: { displayName: true } } }
      }
    },
    orderBy: { avgRating: 'desc' },
    take: 20,
  })

  if (projects.length === 0) {
    await ctx.reply('No reviewed projects yet. Be the first to /review something!')
    return
  }

  // Try to match question keywords to projects
  const keywords = question.toLowerCase().split(/\s+/)
  const matched = projects.filter(p => {
    const name = p.name.toLowerCase()
    const desc = (p.description || '').toLowerCase()
    const cat = (p.category || '').toLowerCase()
    return keywords.some(k => name.includes(k) || desc.includes(k) || cat.includes(k))
  })

  // Use matched projects if any, otherwise top rated
  const relevant = matched.length > 0 ? matched : projects.slice(0, 5)

  // Try Gemini for a nice answer, fall back to structured response
  let aiAnswer: string | null = null
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const projectData = relevant.map(p => {
      const reviews = p.reviews.map(r =>
        `${r.rating}/5 by ${r.reviewer.displayName || 'Anon'}: "${r.content}"`
      ).join('\n    ')
      return `- ${p.name} (Trust: ${Math.round(p.avgRating * 20)}/100, ${p.reviewCount} reviews)\n    ${reviews}`
    }).join('\n')

    const result = await model.generateContent(
      `You are Maiat, a trust score assistant. Answer based ONLY on the data below. Be concise (3-5 sentences). Mention trust scores and reviewer names.\n\nQuestion: "${question}"\n\nTrust Database:\n${projectData}`
    )
    aiAnswer = result.response.text()
  } catch (e) {
    // Gemini unavailable — use structured fallback
  }

  if (aiAnswer) {
    let msg = `🪲 *Maiat Trust Answer*\n\n${aiAnswer}\n\n`
    msg += `_Based on ${relevant.reduce((s, p) => s + p.reviewCount, 0)} verified reviews_`
    await ctx.reply(msg, { parse_mode: 'Markdown' })
  } else {
    // Structured fallback — still useful
    let msg = `🪲 *Here's what I found:*\n\n`
    for (const p of relevant.slice(0, 5)) {
      const score = Math.round(p.avgRating * 20)
      const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
      msg += `${emoji} *${p.name}* — ${score}/100 (${p.reviewCount} reviews)\n`
      if (p.reviews.length > 0) {
        const latest = p.reviews[0]
        const author = latest.reviewer.displayName || 'Anon'
        const text = latest.content.length > 80 ? latest.content.slice(0, 77) + '...' : latest.content
        msg += `   _"${text}" — ${author}_\n\n`
      }
    }
    if (matched.length === 0) {
      msg += `\n_No exact match for "${question}". Showing top trusted projects._`
    }
    await ctx.reply(msg, { parse_mode: 'Markdown' })
  }
})

// ==========================================
// Voice message handler — convert to review or query
// Downloads audio from Telegram, transcribes via Gemini or fallback
// ==========================================

async function transcribeVoice(ctx: BotContext): Promise<string | null> {
  try {
    const file = await ctx.getFile()
    const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`
    
    // Download the audio file
    const response = await fetch(url)
    const buffer = Buffer.from(await response.arrayBuffer())
    const base64Audio = buffer.toString('base64')
    
    // Try Gemini multimodal (audio → text)
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      
      const result = await model.generateContent([
        { text: 'Transcribe this audio message exactly. Return ONLY the transcription, nothing else.' },
        { inlineData: { mimeType: 'audio/ogg', data: base64Audio } }
      ])
      
      const transcript = result.response.text().trim()
      if (transcript && transcript.length > 2) return transcript
    } catch (e) {
      console.log('Gemini transcription failed, checking Telegram transcript')
    }

    // Fallback: Telegram's built-in transcription (premium users)
    // @ts-ignore
    const tgTranscript = ctx.message?.voice?.transcript
    if (tgTranscript) return tgTranscript

    return null
  } catch (e) {
    console.error('Voice download failed:', e)
    return null
  }
}

bot.on('message:voice', async (ctx) => {
  await ctx.reply('🎤 Processing voice message...')
  
  const transcript = await transcribeVoice(ctx)
  
  if (!transcript) {
    await ctx.reply(
      '🎤 Couldn\'t transcribe the voice message.\n\n' +
      'Please type your message instead — I\'ll process it the same way!'
    )
    return
  }

  await ctx.reply(`🎤 _"${transcript}"_`, { parse_mode: 'Markdown' })

  // If in review flow, process as review
  if (ctx.session.step === 'awaiting_review' && ctx.session.projectId && ctx.session.rating) {
    const content = transcript
    const telegramId = ctx.from?.id?.toString()
    if (!telegramId) return

    try {
      const analysis = await analyzeReview(
        ctx.session.projectName || 'Unknown',
        ctx.session.rating,
        content
      )

      if (analysis.quality === 'spam' || analysis.score < 20) {
        ctx.session.step = 'idle'
        await ctx.reply(`❌ Review rejected: ${analysis.reason}`)
        return
      }

      const address = `tg:${telegramId}`
      let user = await prisma.user.findUnique({ where: { address } })
      if (!user) {
        const displayName = ctx.from?.first_name || ctx.from?.username || `User ${telegramId.slice(-4)}`
        user = await prisma.user.create({ data: { address, displayName } })
      }

      const review = await prisma.review.create({
        data: {
          rating: ctx.session.rating,
          content,
          status: 'active',
          reviewerId: user.id,
          projectId: ctx.session.projectId,
        }
      })

      const reviews = await prisma.review.findMany({ where: { projectId: ctx.session.projectId } })
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await prisma.project.update({
        where: { id: ctx.session.projectId },
        data: { avgRating: Math.round(avg * 10) / 10, reviewCount: reviews.length }
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { totalReviews: { increment: 1 }, reputationScore: { increment: 10 } }
      })

      await prisma.scarabBalance.upsert({
        where: { address },
        create: { address, balance: 5, totalEarned: 5 },
        update: { balance: { increment: 5 }, totalEarned: { increment: 5 } },
      })

      const projectName = ctx.session.projectName || 'Project'
      ctx.session.step = 'idle'
      ctx.session.projectId = undefined
      ctx.session.projectName = undefined
      ctx.session.rating = undefined

      const qualityEmoji = analysis.quality === 'high' ? '🟢' : analysis.quality === 'medium' ? '🟡' : '🔴'
      await ctx.reply(
        `✅ *Voice review submitted!*\n\n` +
        `Project: ${projectName}\nRating: ${'⭐'.repeat(review.rating)}\n` +
        `Review: "${content}"\nQuality: ${qualityEmoji} ${analysis.score}/100\n\n` +
        `🪲 +5 Scarab earned!\n\n_${analysis.reason}_`,
        { parse_mode: 'Markdown' }
      )
    } catch (error) {
      console.error('Voice review error:', error)
      await ctx.reply('❌ Failed to process voice review. Try typing it instead.')
      ctx.session.step = 'idle'
    }
    return
  }

  // If NOT in review flow, treat voice as a natural language query
  const text = transcript.toLowerCase()
  const isQuestion = text.includes('?') || text.includes('best') || text.includes('where') ||
    text.includes('recommend') || text.includes('trust') || text.includes('should')

  if (isQuestion) {
    // Search projects by keywords
    const projects = await prisma.project.findMany({
      where: { reviewCount: { gt: 0 } },
      include: {
        reviews: { orderBy: { createdAt: 'desc' }, take: 3, include: { reviewer: { select: { displayName: true } } } }
      },
      orderBy: { avgRating: 'desc' },
      take: 20,
    })

    const keywords = text.split(/\s+/)
    const matched = projects.filter(p => {
      const name = p.name.toLowerCase()
      const desc = (p.description || '').toLowerCase()
      return keywords.some(k => name.includes(k) || desc.includes(k))
    })
    const relevant = matched.length > 0 ? matched : projects.slice(0, 5)

    let msg = `🪲 *Here's what I found:*\n\n`
    for (const p of relevant.slice(0, 5)) {
      const score = Math.round(p.avgRating * 20)
      const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
      msg += `${emoji} *${p.name}* — ${score}/100 (${p.reviewCount} reviews)\n`
      if (p.reviews.length > 0) {
        const latest = p.reviews[0]
        const author = latest.reviewer.displayName || 'Anon'
        const reviewText = latest.content.length > 80 ? latest.content.slice(0, 77) + '...' : latest.content
        msg += `   _"${reviewText}" — ${author}_\n\n`
      }
    }
    await ctx.reply(msg, { parse_mode: 'Markdown' })
  } else {
    await ctx.reply(
      `I heard: _"${transcript}"_\n\n` +
      `Try asking a question like "What's the best coffee?" or start a review with /review`,
      { parse_mode: 'Markdown' }
    )
  }
})

// Also handle natural language in free text (when not in review flow)
// Handle review text (free text when in awaiting_review state)
bot.on('message:text', async (ctx) => {
  // Skip commands
  if (ctx.message.text.startsWith('/')) return
  
  // If not in review flow, check for natural language questions
  if (ctx.session.step !== 'awaiting_review') {
    const text = ctx.message.text.toLowerCase()
    const isQuestion = text.includes('?') || text.includes('best') || text.includes('where') || 
      text.includes('recommend') || text.includes('trust') || text.includes('should i') ||
      text.includes('what\'s good') || text.includes('whats good')
    
    if (isQuestion && text.length > 5) {
      // Treat as natural language query — same as /ask
      ctx.match = ctx.message.text
      // @ts-ignore - reuse ask handler
      await bot.api.raw.sendMessage({ chat_id: ctx.chat.id, text: '🔍 Let me check the trust database...' })
      
      const projects = await prisma.project.findMany({
        where: { reviewCount: { gt: 0 } },
        include: {
          reviews: { orderBy: { createdAt: 'desc' }, take: 3, include: { reviewer: { select: { displayName: true } } } }
        },
        orderBy: { avgRating: 'desc' },
        take: 20,
      })

      if (projects.length === 0) {
        await ctx.reply('No reviewed projects yet!')
        return
      }

      // Match keywords to projects
      const qKeywords = ctx.message.text.toLowerCase().split(/\s+/)
      const matched = projects.filter(p => {
        const name = p.name.toLowerCase()
        const desc = (p.description || '').toLowerCase()
        return qKeywords.some(k => name.includes(k) || desc.includes(k))
      })
      const relevant = matched.length > 0 ? matched : projects.slice(0, 5)

      let msg = `🪲 *Here's what I found:*\n\n`
      for (const p of relevant.slice(0, 5)) {
        const score = Math.round(p.avgRating * 20)
        const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
        msg += `${emoji} *${p.name}* — ${score}/100 (${p.reviewCount} reviews)\n`
        if (p.reviews.length > 0) {
          const latest = p.reviews[0]
          const author = latest.reviewer.displayName || 'Anon'
          const reviewText = latest.content.length > 80 ? latest.content.slice(0, 77) + '...' : latest.content
          msg += `   _"${reviewText}" — ${author}_\n\n`
        }
      }
      await ctx.reply(msg, { parse_mode: 'Markdown' })
      return
    }
    return
  }
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

    // Award Scarab — scale with review quality
    const scarabReward = analysis.quality === 'high' ? 15 
      : analysis.quality === 'medium' ? 10 
      : analysis.quality === 'low' ? 5 
      : 2 // spam that somehow passed
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

// Inline button callbacks
bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data
  await ctx.answerCallbackQuery()
  
  if (data.startsWith('browse_')) {
    const cat = data.replace('browse_', '')
    const category = cat === 'defi' ? 'm/defi' : 'm/ai-agents'
    const label = cat === 'defi' ? 'DeFi' : 'AI Agents'
    const projects = await prisma.project.findMany({
      where: { category },
      take: 10,
      orderBy: { reviewCount: 'desc' },
    })
    if (projects.length === 0) {
      await ctx.reply(`No ${label} projects yet.`)
      return
    }
    let msg = `📂 *${label}* (${projects.length})\n\n`
    const keyboard = new InlineKeyboard()
    for (const p of projects) {
      const score = Math.round(p.avgRating * 20)
      const emoji = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴'
      msg += `${emoji} *${p.name}* — ${score}/100 (${p.reviewCount} reviews)\n`
      keyboard.text(p.name, `score_${p.name}`).row()
    }
    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard })
    return
  }
  
  if (data.startsWith('score_')) {
    const name = data.replace('score_', '')
    const project = await prisma.project.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } },
      include: { reviews: { orderBy: { createdAt: 'desc' }, take: 10, include: { reviewer: { select: { displayName: true } } } } }
    })
    if (!project) { await ctx.reply(`❌ "${name}" not found.`); return }
    
    const trustScore = Math.round(project.avgRating * 20)
    const emoji = trustScore >= 80 ? '🟢' : trustScore >= 50 ? '🟡' : '🔴'
    const risk = trustScore >= 80 ? 'Low' : trustScore >= 50 ? 'Medium' : 'High'
    const cat = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : project.category

    // Generate AI analysis
    await ctx.reply('🔍 Generating AI analysis...')
    
    let aiSummary = ''
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      
      const type = project.category === 'm/ai-agents' ? 'AI agent' : 'DeFi protocol'
      const context = [
        `Project: ${project.name} (${type})`,
        project.description ? `Description: ${project.description}` : '',
        project.website ? `Website: ${project.website}` : '',
        project.address ? `Contract: ${project.address}` : '',
      ].filter(Boolean).join('\n')

      let prompt: string
      if (project.reviews.length === 0) {
        prompt = `You are a crypto/DeFi analyst. Based on this project info, give a trust assessment in 2-3 sentences. Cover: what it does, strengths, risks. Be specific.\n\n${context}`
      } else {
        const reviewTexts = project.reviews.map(r => `${r.rating}/5: "${r.content}"`).join('\n')
        prompt = `You are a crypto analyst. Summarize these reviews of "${project.name}" in 2-3 sentences. Be objective. Mention strengths and concerns.\n\n${context}\n\nReviews:\n${reviewTexts}`
      }
      
      const result = await model.generateContent(prompt)
      aiSummary = result.response.text()
    } catch (e) {
      aiSummary = 'AI analysis temporarily unavailable.'
    }

    let msg = `${emoji} *${project.name}*\n\n`
    msg += `📊 *Trust Score: ${trustScore}/100*\n`
    msg += `⭐ Rating: ${project.avgRating.toFixed(1)}/5 (${project.reviewCount} reviews)\n`
    msg += `🏷 Category: ${cat}\n`
    msg += `⚠️ Risk Level: ${risk}\n`
    if (project.website) msg += `🌐 ${project.website}\n`
    if (project.address) msg += `📝 Contract: \`${project.address.slice(0, 10)}...${project.address.slice(-6)}\`\n`
    
    msg += `\n🤖 *AI Analysis:*\n_${aiSummary}_\n`
    
    if (project.reviews.length > 0) {
      msg += `\n📝 *Latest Reviews:*\n`
      for (const r of project.reviews.slice(0, 3)) {
        const stars = '⭐'.repeat(r.rating)
        const text = r.content.length > 60 ? r.content.slice(0, 57) + '...' : r.content
        const author = r.reviewer.displayName || 'Anon'
        msg += `• ${stars} "${text}" — _${author}_\n`
      }
    }
    
    msg += `\n💬 /review ${project.name} — Add your review`

    const keyboard = new InlineKeyboard().text('📝 Write Review', `review_${project.name}`)
    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard })
  } else if (data.startsWith('review_')) {
    const name = data.replace('review_', '')
    await ctx.reply(`To review *${name}*, send:\n/review ${name}`, { parse_mode: 'Markdown' })
  }
})

bot.catch((err) => {
  console.error('Bot error:', err)
})

// Start
console.log('🪲 Maiat Bot starting...')
bot.start()
console.log('🪲 Maiat Bot is running!')
