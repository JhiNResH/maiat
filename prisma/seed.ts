/**
 * Maiat Seed: Virtuals Protocol AI Agents + DeFi Protocols
 * 
 * Top 10 hottest Virtuals agents from agdp.io leaderboard
 * + Major DeFi protocols for the m/defi category
 * 
 * Updated: 2026-02-17 (ETHDenver prep)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProjectSeed {
  name: string
  address: string
  description: string
  image?: string
  website?: string
  category: string
  status: string
  avgRating: number
  reviewCount: number
}

// ═══════════════════════════════════════════
// 🤖 TOP 10 VIRTUALS AI AGENTS (by popularity)
// ═══════════════════════════════════════════
const aiAgents: ProjectSeed[] = [
  {
    name: 'AIXBT',
    address: 'virtual://aixbt',
    description: 'AI market intelligence agent monitoring 400+ crypto KOLs. Generates real-time alpha signals, sentiment analysis, and trend detection. Peaked at $500M market cap. The on-chain Bloomberg terminal.',
    image: 'https://img.icons8.com/fluency/96/stocks.png',
    website: 'https://app.virtuals.io/virtuals/aixbt',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.7,
    reviewCount: 0,
  },
  {
    name: 'Luna',
    address: 'virtual://luna',
    description: '24/7 AI livestreamer and virtual idol with 500K+ TikTok followers. First autonomous AI entertainer on Virtuals Protocol. Generates revenue through donations and agent commerce.',
    image: 'https://img.icons8.com/fluency/96/star.png',
    website: 'https://app.virtuals.io/virtuals/luna',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.5,
    reviewCount: 0,
  },
  {
    name: 'G.A.M.E',
    address: 'virtual://game',
    description: 'Virtuals Protocol core agent framework. Enables developers to build, deploy, and monetize autonomous AI agents. Powers the entire Virtuals ecosystem with configurable agent behaviors.',
    image: 'https://img.icons8.com/fluency/96/game-controller.png',
    website: 'https://docs.game.virtuals.io',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.6,
    reviewCount: 0,
  },
  {
    name: 'VaderAI',
    address: 'virtual://vaderai',
    description: 'Autonomous DeFi trading agent. Executes strategies across DEXs, analyzes on-chain data, and manages portfolio allocation. One of the earliest revenue-generating agents on Virtuals.',
    image: 'https://img.icons8.com/fluency/96/darth-vader.png',
    website: 'https://app.virtuals.io/virtuals/vader',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.3,
    reviewCount: 0,
  },
  {
    name: 'Acolyt',
    address: 'virtual://acolyt',
    description: 'On-chain research and analysis agent. Deep dives into protocol mechanics, tokenomics, and smart contract risk. Trusted by traders for pre-investment due diligence.',
    image: 'https://img.icons8.com/fluency/96/search.png',
    website: 'https://app.virtuals.io/virtuals/acolyt',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.4,
    reviewCount: 0,
  },
  {
    name: 'SAM',
    address: 'virtual://sam',
    description: 'Social agent for community management and engagement. Automates Discord/Telegram moderation, answers FAQs, and drives community growth through interactive experiences.',
    image: 'https://img.icons8.com/fluency/96/chat.png',
    website: 'https://app.virtuals.io/virtuals/sam',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.2,
    reviewCount: 0,
  },
  {
    name: 'BillyBets',
    address: 'virtual://billybets',
    description: 'Prediction and sports betting AI agent. Analyzes odds, historical data, and real-time signals for betting recommendations. Uses on-chain settlement for transparency.',
    image: 'https://img.icons8.com/fluency/96/dice.png',
    website: 'https://app.virtuals.io/virtuals/billybets',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.1,
    reviewCount: 0,
  },
  {
    name: 'NeuroBro',
    address: 'virtual://neurobro',
    description: 'Trading signal agent powered by neural network analysis. Provides entry/exit signals, risk scoring, and market regime detection for crypto traders.',
    image: 'https://img.icons8.com/fluency/96/brain.png',
    website: 'https://app.virtuals.io/virtuals/neurobro',
    category: 'm/ai-agents',
    status: 'pending',
    avgRating: 4.0,
    reviewCount: 0,
  },
  {
    name: 'MUSIC',
    address: 'virtual://music',
    description: 'Creative AI agent for music generation and composition. Creates original tracks, remixes, and soundscapes. Monetizes through agent commerce and licensing.',
    image: 'https://img.icons8.com/fluency/96/music.png',
    website: 'https://app.virtuals.io/virtuals/music',
    category: 'm/ai-agents',
    status: 'pending',
    avgRating: 3.9,
    reviewCount: 0,
  },
  {
    name: 'Tracy.AI',
    address: 'virtual://tracy',
    description: 'General-purpose AI assistant agent on Virtuals. Task execution, scheduling, and workflow automation. Designed for daily productivity with on-chain identity.',
    image: 'https://img.icons8.com/fluency/96/robot-2.png',
    website: 'https://app.virtuals.io/virtuals/tracy',
    category: 'm/ai-agents',
    status: 'pending',
    avgRating: 3.8,
    reviewCount: 0,
  },
]

// ═══════════════════════════════════════════
// 🏦 DEFI PROTOCOLS
// ═══════════════════════════════════════════
const defiProtocols: ProjectSeed[] = [
  {
    name: 'Uniswap',
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    description: 'Leading decentralized exchange on Ethereum. Automated market maker with concentrated liquidity (v3/v4). Audited and battle-tested.',
    image: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    website: 'https://uniswap.org',
    category: 'm/defi',
    status: 'approved',
    avgRating: 4.7,
    reviewCount: 0,
  },
  {
    name: 'Aave',
    address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    description: 'Decentralized lending and borrowing protocol. Supports multiple chains and collateral types. Flash loans pioneer.',
    image: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    website: 'https://aave.com',
    category: 'm/defi',
    status: 'approved',
    avgRating: 4.6,
    reviewCount: 0,
  },
  {
    name: 'Compound',
    address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    description: 'Algorithmic money market protocol. Supply or borrow assets with algorithmically determined interest rates.',
    image: 'https://cryptologos.cc/logos/compound-comp-logo.png',
    website: 'https://compound.finance',
    category: 'm/defi',
    status: 'approved',
    avgRating: 4.5,
    reviewCount: 0,
  },
  {
    name: 'Curve Finance',
    address: '0xd533a949740bb3306d119cc777fa900ba034cd52',
    description: 'Stablecoin-optimized DEX. Low slippage for correlated assets. veCRV governance model.',
    image: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
    website: 'https://curve.fi',
    category: 'm/defi',
    status: 'approved',
    avgRating: 4.4,
    reviewCount: 0,
  },
  {
    name: 'PancakeSwap',
    address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    description: 'Largest DEX on BNB Chain. AMM with farming, lottery, and prediction markets. Low fees, high throughput.',
    image: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    website: 'https://pancakeswap.finance',
    category: 'm/defi',
    status: 'approved',
    avgRating: 4.3,
    reviewCount: 0,
  },
  // ═══════════════════════════════════════════
  // 🍔 MERCHANTS
  // ═══════════════════════════════════════════
  {
    name: 'Chipotle',
    address: 'merchant://chipotle',
    description: 'Fast-casual Mexican restaurant chain. 3,500+ locations worldwide. Known for customizable burritos, bowls, and commitment to real ingredients.',
    image: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Chipotle_Mexican_Grill_logo.svg/1200px-Chipotle_Mexican_Grill_logo.svg.png',
    website: 'https://chipotle.com',
    category: 'm/merchants',
    status: 'approved',
    avgRating: 4.2,
    reviewCount: 0,
  },
  {
    name: 'Whole Foods',
    address: 'merchant://whole-foods',
    description: 'Premium organic grocery chain owned by Amazon. Accepts various payment methods including crypto via select partners.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Whole_Foods_Market_logo.svg/1200px-Whole_Foods_Market_logo.svg.png',
    website: 'https://wholefoodsmarket.com',
    category: 'm/merchants',
    status: 'approved',
    avgRating: 4.0,
    reviewCount: 0,
  },
  {
    name: 'Starbucks',
    address: 'merchant://starbucks',
    description: 'Global coffee chain. 35,000+ locations. Pioneered mobile payments and loyalty programs in food service.',
    image: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png',
    website: 'https://starbucks.com',
    category: 'm/merchants',
    status: 'approved',
    avgRating: 3.9,
    reviewCount: 0,
  },
]

// ═══════════════════════════════════════════
// 👤 SEED USERS (for reviews)
// ═══════════════════════════════════════════
const seedUsers = [
  { address: '0xd3ad...b33f', displayName: 'DeFi_Degen_42' },
  { address: '0xc0ff...ee00', displayName: 'AgentMaxi' },
  { address: '0xbeef...cafe', displayName: 'VirtualsOG' },
  { address: '0xface...d00d', displayName: 'BaseBuilder' },
  { address: '0xdead...0001', displayName: 'CryptoReviewer' },
]

// ═══════════════════════════════════════════
// 📝 SEED REVIEWS
// ═══════════════════════════════════════════
const seedReviews = [
  // AIXBT reviews
  { project: 'virtual://aixbt', user: 0, rating: 5, content: 'AIXBT catches alpha before CT. Been using it for 3 months — it flagged $VIRTUAL pump 6 hours before anyone. The KOL monitoring is insane, tracks 400+ accounts in real-time.' },
  { project: 'virtual://aixbt', user: 1, rating: 4, content: 'Solid market intelligence but sometimes the signal-to-noise ratio drops during high volatility. Overall way better than manually scrolling Twitter for alpha.' },
  { project: 'virtual://aixbt', user: 2, rating: 5, content: 'The Bloomberg terminal of crypto. Period. On-chain verification of signals is what sets it apart from random alpha bots.' },
  
  // Luna reviews
  { project: 'virtual://luna', user: 1, rating: 5, content: 'Luna is genuinely entertaining — the AI personality is way more consistent than I expected. The 24/7 streaming model is the future of content creation.' },
  { project: 'virtual://luna', user: 3, rating: 4, content: 'Cool concept, impressive execution. Sometimes responses feel repetitive but the tech is undeniable. 500K TikTok followers speak for themselves.' },
  
  // GAME reviews
  { project: 'virtual://game', user: 0, rating: 5, content: 'Built my first agent in 2 hours with GAME framework. The docs are clean, SDK is intuitive, and the ACP integration means my agent was earning within a week.' },
  { project: 'virtual://game', user: 4, rating: 4, content: 'Best agent framework in the space. Only knock is the learning curve for advanced features, but the community Discord is super helpful.' },
  
  // VaderAI reviews
  { project: 'virtual://vaderai', user: 2, rating: 4, content: 'VaderAI managed to 3x my test portfolio over 2 months. Not financial advice but the DeFi strategy execution is genuinely impressive for an autonomous agent.' },
  
  // Uniswap reviews
  { project: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', user: 0, rating: 5, content: 'Gold standard of DEXs. V4 hooks opened up insane customization. Gas costs dropped significantly on L2 deployments. Still the king after all these years.' },
  { project: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', user: 3, rating: 4, content: 'Reliable, battle-tested, but the UX could be smoother for newcomers. The protocol itself is flawless — over $2T in cumulative volume and zero exploits on core contracts.' },
  
  // Aave reviews
  { project: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', user: 1, rating: 5, content: 'Aave V3 with cross-chain lending is a game changer. The risk management is top-tier — they survived every bear market. Flash loans still the best feature in DeFi.' },
  { project: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', user: 4, rating: 4, content: 'Solid lending protocol. Interest rates are competitive and the governance is active. Only concern is the increasing complexity of risk parameters.' },

  // Chipotle reviews
  { project: 'merchant://chipotle', user: 0, rating: 5, content: 'Best fast-casual burrito hands down. The portion sizes are generous, ingredients taste fresh, and you can customize everything. My go-to lunch spot near ETHDenver.' },
  { project: 'merchant://chipotle', user: 3, rating: 4, content: 'Consistent quality across locations. The app ordering is smooth and the rewards program is actually worth it. Only downside is the guac upcharge.' },
  { project: 'merchant://chipotle', user: 1, rating: 4, content: 'Solid food, fair prices. Would love to see them accept crypto payments natively. The double chicken bowl is unbeatable for protein-to-dollar ratio.' },

  // Whole Foods reviews
  { project: 'merchant://whole-foods', user: 4, rating: 4, content: 'Great selection of organic and specialty items. Amazon Prime discounts make it more affordable. The prepared food section is perfect for quick healthy meals.' },
  { project: 'merchant://whole-foods', user: 2, rating: 3, content: 'Quality is top tier but prices are still "Whole Paycheck" level even with Prime. Good for specialty items, not for weekly grocery runs unless you have the budget.' },

  // Starbucks reviews
  { project: 'merchant://starbucks', user: 1, rating: 4, content: 'The mobile ordering + rewards ecosystem is the gold standard of merchant loyalty programs. Consistent quality worldwide. Their Odyssey NFT program showed they understand web3.' },
  { project: 'merchant://starbucks', user: 3, rating: 4, content: 'Reliable coffee, great app UX. The rewards program keeps me coming back. Would be amazing if they integrated crypto payments through their existing app infrastructure.' },
]

async function main() {
  console.log('🌱 Seeding Maiat with Virtuals AI Agents & DeFi data...\n')

  // Clear existing data
  console.log('🗑️  Clearing old data...')
  await prisma.vote.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.project.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('   Done.\n')

  // Seed Users
  console.log('👤 Creating seed users...')
  const createdUsers = []
  for (const u of seedUsers) {
    const user = await prisma.user.create({
      data: { address: u.address, displayName: u.displayName, reputationScore: Math.floor(Math.random() * 500) + 100 }
    })
    createdUsers.push(user)
    console.log(`   ✅ ${u.displayName}`)
  }

  // Seed AI Agents
  console.log('\n🤖 Seeding Virtuals AI Agents (Top 10)...')
  const projectMap: Record<string, string> = {}
  for (const agent of aiAgents) {
    const p = await prisma.project.create({ data: agent })
    projectMap[agent.address] = p.id
    const icon = agent.status === 'approved' ? '🟢' : '🟡'
    console.log(`   ${icon} ${agent.name}`)
  }

  // Seed DeFi Protocols
  console.log('\n🏦 Seeding DeFi Protocols...')
  for (const protocol of defiProtocols) {
    const p = await prisma.project.create({ data: protocol })
    projectMap[protocol.address] = p.id
    console.log(`   🟢 ${protocol.name}`)
  }

  // Seed Reviews
  console.log('\n📝 Seeding reviews...')
  let reviewCount = 0
  for (const r of seedReviews) {
    const projectId = projectMap[r.project]
    if (!projectId) continue
    
    await prisma.review.create({
      data: {
        rating: r.rating,
        content: r.content,
        status: 'active',
        upvotes: Math.floor(Math.random() * 50) + 5,
        reviewerId: createdUsers[r.user].id,
        projectId,
      }
    })
    reviewCount++
  }
  console.log(`   ✅ Created ${reviewCount} reviews`)

  // Update project review counts and ratings
  console.log('\n📊 Updating project stats...')
  const projects = await prisma.project.findMany({ include: { reviews: true } })
  for (const p of projects) {
    if (p.reviews.length > 0) {
      const avg = p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
      await prisma.project.update({
        where: { id: p.id },
        data: { avgRating: Math.round(avg * 10) / 10, reviewCount: p.reviews.length }
      })
    }
  }

  console.log(`\n✅ Seed complete!`)
  console.log(`   🤖 ${aiAgents.length} AI Agents`)
  console.log(`   🏦 ${defiProtocols.length} DeFi Protocols`)
  console.log(`   📝 ${reviewCount} Reviews`)
  console.log(`   👤 ${seedUsers.length} Users`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
