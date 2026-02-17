/**
 * Maat V2 Seed: AI Agents & DeFi Protocols
 * 
 * Curated dataset for trust layer verification.
 * Categories: m/ai-agents, m/defi
 * 
 * Created: 2026-02-16 (Reddit-style UI migration)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProjectSeed {
  name: string
  address: string // unique identifier
  description: string
  image?: string
  website?: string
  category: string
  status: string // approved, pending, rejected
  avgRating: number
  reviewCount: number
}

const aiAgents: ProjectSeed[] = [
  // ═══════════════════════════════════════════
  // 🤖 AI AGENTS - VERIFIED
  // ═══════════════════════════════════════════
  {
    name: 'OpenClaw Agent',
    address: 'agent://openclaw/main',
    description: 'Official OpenClaw autonomous agent. Handles GitHub workflows, code review, and project management. Built-in safety rails and human oversight.',
    image: 'https://img.icons8.com/fluency/96/bot.png',
    website: 'https://openclaw.ai',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.8,
    reviewCount: 234,
  },
  {
    name: 'AutoGPT',
    address: 'agent://autogpt',
    description: 'Pioneer autonomous GPT agent. Experimental framework for chaining LLM thoughts. Use with caution in production environments.',
    image: 'https://img.icons8.com/fluency/96/artificial-intelligence.png',
    website: 'https://github.com/Significant-Gravitas/AutoGPT',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.2,
    reviewCount: 567,
  },
  {
    name: 'BabyAGI',
    address: 'agent://babyagi',
    description: 'Task-driven autonomous agent using OpenAI and Pinecone. Creates, prioritizes, and executes tasks based on objectives.',
    image: 'https://img.icons8.com/fluency/96/robot.png',
    website: 'https://github.com/yoheinakajima/babyagi',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.1,
    reviewCount: 298,
  },
  {
    name: 'AgentGPT',
    address: 'agent://agentgpt',
    description: 'Browser-based autonomous AI agent platform. Deploy custom agents for specific tasks. Free tier available.',
    image: 'https://img.icons8.com/fluency/96/web.png',
    website: 'https://agentgpt.reworkd.ai',
    category: 'm/ai-agents',
    status: 'approved',
    avgRating: 4.3,
    reviewCount: 421,
  },

  // ═══════════════════════════════════════════
  // 🤖 AI AGENTS - UNREVIEWED
  // ═══════════════════════════════════════════
  {
    name: 'SuperAGI',
    address: 'agent://superagi',
    description: 'Open-source autonomous AI agent framework. Supports multiple LLMs, tools, and vector databases. Active community development.',
    image: 'https://img.icons8.com/fluency/96/artificial-intelligence.png',
    website: 'https://superagi.com',
    category: 'm/ai-agents',
    status: 'pending',
    avgRating: 3.9,
    reviewCount: 87,
  },
  {
    name: 'MetaGPT',
    address: 'agent://metagpt',
    description: 'Multi-agent framework for software development. Simulates product manager, architect, engineer roles. Generates full codebases.',
    image: 'https://img.icons8.com/fluency/96/code.png',
    website: 'https://github.com/geekan/MetaGPT',
    category: 'm/ai-agents',
    status: 'pending',
    avgRating: 4.0,
    reviewCount: 112,
  },
]

const defiProtocols: ProjectSeed[] = [
  // ═══════════════════════════════════════════
  // 🏦 DEFI PROTOCOLS - VERIFIED
  // ═══════════════════════════════════════════
  {
    name: 'Uniswap',
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    description: 'Leading decentralized exchange on Ethereum. Automated market maker with concentrated liquidity (v3). Audited and battle-tested.',
    image: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    website: 'https://uniswap.org',
    category: 'm/defi',
    status: 'approved',
    avgRating: 4.7,
    reviewCount: 892,
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
    reviewCount: 743,
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
    reviewCount: 621,
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
    reviewCount: 512,
  },

  // ═══════════════════════════════════════════
  // 🏦 DEFI PROTOCOLS - UNREVIEWED
  // ═══════════════════════════════════════════
  {
    name: 'Yearn Finance',
    address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
    description: 'Yield aggregator that automatically moves funds between lending protocols to maximize returns. Community-driven.',
    image: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png',
    website: 'https://yearn.finance',
    category: 'm/defi',
    status: 'pending',
    avgRating: 4.2,
    reviewCount: 289,
  },
  {
    name: 'SushiSwap',
    address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    description: 'Community-driven DEX forked from Uniswap. Multi-chain support, AMM with incentive mechanisms.',
    image: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
    website: 'https://sushi.com',
    category: 'm/defi',
    status: 'pending',
    avgRating: 4.0,
    reviewCount: 434,
  },
]

async function main() {
  console.log('🌱 Seeding Maat V2 with AI Agents & DeFi data...\n')

  // Clear existing projects
  const deletedAgents = await prisma.project.deleteMany({
    where: { category: 'm/ai-agents' }
  })
  const deletedDefi = await prisma.project.deleteMany({
    where: { category: 'm/defi' }
  })
  console.log(`🗑️  Cleared ${deletedAgents.count} AI Agents, ${deletedDefi.count} DeFi projects\n`)

  // Seed AI Agents
  console.log('🤖 Seeding AI Agents...')
  let agentsCreated = 0
  for (const agent of aiAgents) {
    try {
      await prisma.project.create({ data: agent })
      const icon = agent.status === 'approved' ? '🟢' : agent.status === 'pending' ? '🟡' : '🔴'
      console.log(`${icon} ${agent.name} (${agent.status}) — ${agent.reviewCount} reviews, ★${agent.avgRating}`)
      agentsCreated++
    } catch (e: any) {
      console.error(`❌ Failed to seed ${agent.name}: ${e.message}`)
    }
  }

  // Seed DeFi Protocols
  console.log('\n🏦 Seeding DeFi Protocols...')
  let defiCreated = 0
  for (const protocol of defiProtocols) {
    try {
      await prisma.project.create({ data: protocol })
      const icon = protocol.status === 'approved' ? '🟢' : protocol.status === 'pending' ? '🟡' : '🔴'
      console.log(`${icon} ${protocol.name} (${protocol.status}) — ${protocol.reviewCount} reviews, ★${protocol.avgRating}`)
      defiCreated++
    } catch (e: any) {
      console.error(`❌ Failed to seed ${protocol.name}: ${e.message}`)
    }
  }

  console.log(`\n✅ Seeded ${agentsCreated} AI Agents, ${defiCreated} DeFi protocols`)
  console.log(`   Total: ${agentsCreated + defiCreated} projects`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
