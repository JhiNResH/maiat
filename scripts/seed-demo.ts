/**
 * Maiat ETHDenver Demo Seed
 * 
 * Seeds Jerry's Coffee with polished demo data.
 * Run: npx tsx scripts/seed-demo.ts
 * 
 * Safe to re-run — uses upsert.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('☕ Seeding ETHDenver demo data...\n')

  // ─── Demo Users ──────────────────────────────────────────
  const users = [
    { address: 'demo:persona_a', displayName: 'AgentMaxi' },
    { address: 'demo:persona_b', displayName: 'BaseBuilder' },
    { address: 'demo:persona_c', displayName: 'CryptoReviewer' },
    { address: 'demo:persona_d', displayName: 'VirtualsOG' },
  ]

  const createdUsers = []
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { address: u.address },
      update: { displayName: u.displayName },
      create: { address: u.address, displayName: u.displayName, reputationScore: 80, totalReviews: 3 },
    })
    createdUsers.push(user)
    console.log(`  ✓ User: ${u.displayName}`)
  }

  // ─── Jerry's Coffee ──────────────────────────────────────
  const jerrys = await prisma.project.upsert({
    where: { address: 'base://jerrys-coffee' },
    update: {
      avgRating: 4.3,
      reviewCount: 3,
      status: 'approved',
    },
    create: {
      name: "Jerry's Coffee",
      slug: 'jerrys-coffee',
      address: 'base://jerrys-coffee',
      description: 'Artisan coffee shop accepting crypto payments on Base. Known for premium single-origin espresso and fast service. The first trust-verified merchant on Maiat.',
      image: '/icons/coffee-to-go.png',
      website: 'https://jerryscoffee.eth',
      category: 'm/coffee',
      status: 'approved',
      avgRating: 4.3,
      reviewCount: 3,
    }
  })
  console.log(`\n  ✓ Project: Jerry's Coffee (id: ${jerrys.id})`)

  // ─── Blockchain Beans ────────────────────────────────────
  const beans = await prisma.project.upsert({
    where: { address: 'base://blockchain-beans' },
    update: { avgRating: 5.0, reviewCount: 1, status: 'approved' },
    create: {
      name: 'Blockchain Beans',
      slug: 'blockchain-beans',
      address: 'base://blockchain-beans',
      description: 'Web3-native coffee roasters. Pay with USDC on Base, earn loyalty NFTs. Every bean sourced on-chain with full supply chain transparency.',
      image: '/icons/coffee-to-go.png',
      website: 'https://blockchainbeans.xyz',
      category: 'm/coffee',
      status: 'approved',
      avgRating: 5.0,
      reviewCount: 1,
    }
  })
  console.log(`  ✓ Project: Blockchain Beans (id: ${beans.id})`)

  // ─── Reviews for Jerry's Coffee ──────────────────────────
  const jerryReviews = [
    {
      rating: 4,
      content: "Great espresso, fast service. Paid with USDC on Base — transaction confirmed in 2 seconds. The barista even explained how the on-chain receipt works.",
      reviewerId: createdUsers[0].id, // AgentMaxi
    },
    {
      rating: 5,
      content: "Best crypto-friendly coffee shop in Denver. Single-origin Ethiopian pour-over was incredible. The whole experience from payment to loyalty rewards is seamless.",
      reviewerId: createdUsers[1].id, // BaseBuilder
    },
    {
      rating: 4,
      content: "Solid coffee, cool vibe. The Base payment integration is smooth — no awkward wait times. Would definitely come back during ETHDenver.",
      reviewerId: createdUsers[2].id, // CryptoReviewer
    },
  ]

  // Delete old demo reviews first (clean slate)
  await prisma.review.deleteMany({
    where: {
      projectId: jerrys.id,
      reviewerId: { in: createdUsers.map(u => u.id) },
    }
  })

  for (const r of jerryReviews) {
    await prisma.review.create({
      data: {
        rating: r.rating,
        content: r.content,
        status: 'active',
        reviewerId: r.reviewerId,
        projectId: jerrys.id,
      }
    })
    console.log(`  ✓ Review: "${r.content.slice(0, 50)}..."`)
  }

  // ─── Review for Blockchain Beans ─────────────────────────
  await prisma.review.deleteMany({
    where: { projectId: beans.id, reviewerId: { in: createdUsers.map(u => u.id) } }
  })
  await prisma.review.create({
    data: {
      rating: 5,
      content: "Supply chain transparency is real — I scanned the QR and saw exactly where my beans came from. Coffee quality matches the tech. Loyalty NFT is a nice touch.",
      status: 'active',
      reviewerId: createdUsers[3].id, // VirtualsOG
      projectId: beans.id,
    }
  })
  console.log(`  ✓ Review: Blockchain Beans — VirtualsOG`)

  // ─── Final scores update ──────────────────────────────────
  await prisma.project.update({
    where: { id: jerrys.id },
    data: { avgRating: 4.3, reviewCount: 3 }
  })
  await prisma.project.update({
    where: { id: beans.id },
    data: { avgRating: 5.0, reviewCount: 1 }
  })

  console.log('\n✅ Demo seed complete!\n')
  console.log('Demo commands:')
  console.log('  /demo_purchase           → simulates Base USDC payment → triggers review flow')
  console.log("  What's the best coffee?  → returns Jerry's Coffee + Blockchain Beans")
  console.log("  /score Jerry's Coffee    → shows 86/100 trust score with AI analysis\n")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())