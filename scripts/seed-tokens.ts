/**
 * Seed swap tokens as reviewable projects in Maiat DB
 * Token = Project — every token has a review page
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SWAP_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', slug: 'eth', category: 'm/defi' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', slug: 'usdc', category: 'm/defi' },
  { symbol: 'WETH', name: 'Wrapped ETH', address: '0x4200000000000000000000000000000000000006', slug: 'weth', category: 'm/defi' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', slug: 'dai', category: 'm/defi' },
  { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', slug: 'cbbtc', category: 'm/defi' },
  { symbol: 'AERO', name: 'Aerodrome Finance', address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', slug: 'aerodrome', category: 'm/defi' },
  { symbol: 'DEGEN', name: 'DEGEN', address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', slug: 'degen', category: 'm/defi' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2', slug: 'usdt', category: 'm/defi' },
]

async function main() {
  for (const token of SWAP_TOKENS) {
    const existing = await prisma.project.findFirst({
      where: { OR: [{ address: token.address }, { slug: token.slug }] }
    })
    if (existing) {
      console.log(`  ✓ ${token.symbol} already exists (${existing.slug})`)
      continue
    }
    await prisma.project.create({
      data: {
        name: token.name,
        slug: token.slug,
        address: token.address,
        category: token.category,
        description: `${token.name} (${token.symbol}) on Base — community-reviewed token`,
        status: 'approved',
        avgRating: 0,
        reviewCount: 0,
      }
    })
    console.log(`  + Seeded ${token.symbol} → /defi/${token.slug}`)
  }

  // Add demo reviews for some tokens
  const demoUser = await prisma.user.upsert({
    where: { address: '0xdemo000000000000000000000000000000000001' },
    update: {},
    create: { address: '0xdemo000000000000000000000000000000000001', displayName: 'DeFi Reviewer', reputationScore: 150, totalReviews: 5 }
  })

  const demoReviews = [
    { slug: 'eth', rating: 5, content: 'The most battle-tested and trusted asset in crypto. Maximum liquidity, maximum trust.', upvotes: 42 },
    { slug: 'usdc', rating: 5, content: 'Fully backed, regularly audited stablecoin. Circle is transparent with reserves. Safe for large holdings.', upvotes: 38 },
    { slug: 'dai', rating: 4, content: 'Decentralized stablecoin backed by over-collateralized crypto. Slight depeg risk but solid track record.', upvotes: 22 },
    { slug: 'degen', rating: 2, content: 'Meme token with high volatility. Fun community but no fundamental value. High risk of rug.', upvotes: 8 },
    { slug: 'aerodrome', rating: 4, content: 'Leading DEX on Base. Good tokenomics with vote-escrowed model. Team delivers consistently.', upvotes: 15 },
  ]

  for (const r of demoReviews) {
    const project = await prisma.project.findUnique({ where: { slug: r.slug } })
    if (!project) continue
    const exists = await prisma.review.findFirst({ where: { reviewerId: demoUser.id, projectId: project.id } })
    if (exists) { console.log(`  ✓ Review for ${r.slug} exists`); continue }
    await prisma.review.create({
      data: { rating: r.rating, content: r.content, upvotes: r.upvotes, status: 'active', reviewerId: demoUser.id, projectId: project.id }
    })
    await prisma.project.update({
      where: { id: project.id },
      data: { reviewCount: { increment: 1 }, avgRating: r.rating }
    })
    console.log(`  + Review for ${r.slug}: ${r.rating}★`)
  }

  console.log('\n✅ Token seeding complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
