/**
 * Demo: Autonomous AI Agent using Maiat Trust API with x402 payments on Kite Chain
 * 
 * This script demonstrates:
 * 1. Agent authenticates with its own wallet (verifiable identity)
 * 2. Agent requests trust score → gets 402 Payment Required
 * 3. Agent signs x402 payment authorization (EIP-712)
 * 4. Agent retries with payment → gets trust report
 * 5. Agent makes decision based on trust score
 * 
 * Usage: npx tsx scripts/demo-agent-x402.ts [project-slug]
 * 
 * For ETHDenver / Kite AI Bounty
 */

import { ethers } from 'ethers'

const MAIAT_API = process.env.MAIAT_API_URL || 'https://maiat.vercel.app'
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey

const agent = new ethers.Wallet(AGENT_PRIVATE_KEY)
const projectSlug = process.argv[2] || 'chipotle'

console.log('🤖 ═══════════════════════════════════════════')
console.log('   Maiat Trust Agent — x402 Demo on Kite Chain')
console.log('═══════════════════════════════════════════════\n')
console.log(`🆔 Agent Address: ${agent.address}`)
console.log(`🎯 Target: ${projectSlug}`)
console.log(`🌐 API: ${MAIAT_API}\n`)

async function run() {
  // Step 1: Request trust score (will get 402)
  console.log('📡 Step 1: Requesting trust score...')
  const res1 = await fetch(`${MAIAT_API}/api/v1/trust/${projectSlug}`, {
    headers: { 'X-Agent-Id': agent.address },
  })

  if (res1.status === 402) {
    const paymentReq = await res1.json()
    console.log(`💰 Step 2: Payment Required!`)
    console.log(`   Amount: ${paymentReq.payment.amount} ${paymentReq.payment.currency}`)
    console.log(`   Network: ${paymentReq.payment.network}`)
    console.log(`   Receiver: ${paymentReq.payment.receiver}`)
    console.log(`   Action: ${paymentReq.payment.action}\n`)

    // Step 3: Sign x402 payment
    console.log('✍️  Step 3: Signing x402 payment authorization (EIP-712)...')
    
    const paymentData = {
      from: agent.address,
      to: paymentReq.payment.receiver,
      value: ethers.parseEther(paymentReq.payment.amount),
      action: paymentReq.payment.action,
      resource: paymentReq.payment.resource,
      nonce: BigInt(paymentReq.payment.nonce),
      deadline: BigInt(paymentReq.payment.deadline),
    }

    const signature = await agent.signTypedData(
      paymentReq.payment.domain,
      paymentReq.payment.types,
      paymentData,
    )

    const paymentHeader = Buffer.from(JSON.stringify({
      from: agent.address,
      to: paymentReq.payment.receiver,
      value: paymentReq.payment.amount,
      action: paymentReq.payment.action,
      resource: paymentReq.payment.resource,
      nonce: paymentReq.payment.nonce,
      deadline: String(paymentReq.payment.deadline),
      signature,
    })).toString('base64')

    console.log(`   Signature: ${signature.slice(0, 20)}...`)
    console.log(`   Payment header: ${paymentHeader.slice(0, 30)}...\n`)

    // Step 4: Retry with payment
    console.log('📡 Step 4: Retrying with x402 payment...')
    const res2 = await fetch(`${MAIAT_API}/api/v1/trust/${projectSlug}`, {
      headers: {
        'X-Agent-Id': agent.address,
        'X-Payment': paymentHeader,
      },
    })

    if (res2.ok) {
      const report = await res2.json()
      
      console.log('\n✅ ═══════════════════════════════════════════')
      console.log('   TRUST REPORT RECEIVED')
      console.log('═══════════════════════════════════════════════\n')
      
      console.log(`📊 ${report.project.name} Trust Score: ${report.trustScore.overall}/100`)
      console.log(`🚦 Risk Level: ${report.trustScore.riskLevel.toUpperCase()}`)
      console.log(`📋 Recommendation: ${report.trustScore.recommendation}`)
      console.log(`⭐ Rating: ${report.reviews.avgRating}/5 (${report.reviews.count} reviews)`)
      
      if (report.trustScore.breakdown) {
        console.log(`\n📋 Breakdown:`)
        console.log(`   ⛓️  On-chain: ${report.trustScore.breakdown.onChainActivity}/100`)
        console.log(`   ✅ Reviews:  ${report.trustScore.breakdown.verifiedReviews}/100`)
        console.log(`   👥 Community: ${report.trustScore.breakdown.communityTrust}/100`)
        console.log(`   🤖 AI Base:  ${report.trustScore.breakdown.aiQuality}/100`)
      }

      if (report.aiAnalysis) {
        console.log(`\n🧠 AI Analysis: ${report.aiAnalysis}`)
      }

      if (report.payment) {
        console.log(`\n💰 Payment Receipt:`)
        console.log(`   Protocol: ${report.payment.protocol}`)
        console.log(`   Amount: ${report.payment.amount} ${report.payment.currency}`)
        console.log(`   Network: ${report.payment.network}`)
        if (report.payment.txHash) {
          console.log(`   Tx: ${report.payment.explorer}`)
        }
        console.log(`   Status: ${report.payment.status}`)
      }

      // Step 5: Agent decision
      console.log('\n🤖 ═══════════════════════════════════════════')
      console.log('   AGENT DECISION')
      console.log('═══════════════════════════════════════════════\n')
      
      if (report.trustScore.overall >= 80) {
        console.log(`✅ PROCEED — ${report.project.name} is trusted (${report.trustScore.overall}/100).`)
        console.log(`   Agent would execute transaction with this merchant/protocol.`)
      } else if (report.trustScore.overall >= 50) {
        console.log(`⚠️  CAUTION — ${report.project.name} has moderate trust (${report.trustScore.overall}/100).`)
        console.log(`   Agent would request human confirmation before proceeding.`)
      } else {
        console.log(`🚫 BLOCK — ${report.project.name} trust too low (${report.trustScore.overall}/100).`)
        console.log(`   Agent refuses to transact with this entity.`)
      }
    } else {
      const err = await res2.json()
      console.log(`❌ Payment verification failed: ${err.reason || err.error}`)
    }
  } else if (res1.ok) {
    // Free tier response
    const report = await res1.json()
    console.log(`📊 Trust Score: ${report.trustScore.overall}/100 (free tier)`)
  }
}

run().catch(console.error)
