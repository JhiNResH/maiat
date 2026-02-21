/**
 * GET /api/v1/trust/:slug
 * 
 * x402-gated Trust Score API for AI agents.
 * Agents pay KITE tokens on Kite Chain to query trust scores.
 * 
 * Flow:
 * 1. Agent sends GET without payment → receives 402 + payment details
 * 2. Agent signs EIP-712 payment authorization
 * 3. Agent retries with X-PAYMENT header → receives trust report
 * 
 * Kite AI Bounty: Agent-native payments + verifiable identity
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateTrustScore, getSimpleTrustScore } from '@/lib/trust-score'
import {
  createPaymentRequirement,
  verifyAndSettlePayment,
  format402Response,
  getExplorerUrl,
} from '@/lib/kite-x402'

export const dynamic = 'force-dynamic'

// Free tier: allow some queries without payment (for demo/testing)
const FREE_TIER_ENABLED = process.env.X402_FREE_TIER !== 'false'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const paymentHeader = request.headers.get('x-payment')
  const agentId = request.headers.get('x-agent-id') || 'anonymous'

  // Check for x402 payment
  if (!paymentHeader) {
    // If free tier enabled, check for ?free=true param (for demo)
    const isFreeRequest = FREE_TIER_ENABLED && request.nextUrl.searchParams.get('free') === 'true'
    
    if (!isFreeRequest) {
      // Return 402 Payment Required
      const requirement = createPaymentRequirement('trust-query', `/api/v1/trust/${slug}`)
      const body = format402Response(requirement)
      
      return NextResponse.json(body, {
        status: 402,
        headers: {
          'X-Payment-Protocol': 'x402',
          'X-Payment-Network': 'kite-testnet',
          'X-Payment-Amount': requirement.amount,
          'X-Payment-Currency': 'KITE',
        },
      })
    }
  }

  // Verify payment if provided
  let paymentResult = null
  if (paymentHeader) {
    paymentResult = await verifyAndSettlePayment(paymentHeader)
    
    if (!paymentResult.valid) {
      return NextResponse.json({
        error: 'Payment verification failed',
        reason: paymentResult.error,
        protocol: 'x402',
      }, { status: 402 })
    }
  }

  // Fetch project
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { slug: slug.toLowerCase() },
        { name: { contains: slug, mode: 'insensitive' } },
      ],
    },
    include: {
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { reviewer: true },
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: `Project not found: ${slug}` }, { status: 404 })
  }

  // Calculate trust score
  let score: number
  let breakdown: { onChainActivity: number; verifiedReviews: number; communityTrust: number; aiQuality: number }
  
  try {
    const result = await calculateTrustScore(project.slug)
    score = result.score
    breakdown = result.breakdown
  } catch {
    score = getSimpleTrustScore(project.name, project.category, project.avgRating, project.reviewCount)
    breakdown = {
      onChainActivity: 0,
      verifiedReviews: Math.round(project.avgRating * 20),
      communityTrust: 0,
      aiQuality: score,
    }
  }

  // Generate AI analysis
  let aiAnalysis = null
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (GEMINI_KEY) {
    try {
      const reviewSummary = project.reviews.slice(0, 3).map(r =>
        `${r.rating}★: "${r.content.slice(0, 100)}"`
      ).join('\n')

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Analyze trust for "${project.name}" (${project.category}). Score: ${score}/100. Reviews:\n${reviewSummary}\n\nGive 2-sentence analysis: strength + risk. Under 150 chars.` }] }],
            generationConfig: { maxOutputTokens: 100, temperature: 0.3 },
          }),
        }
      )
      const data = await res.json()
      aiAnalysis = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
    } catch {}
  }

  // Build response
  const riskLevel = score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high'
  
  const response: any = {
    protocol: 'maiat-trust-v1',
    project: {
      name: project.name,
      slug: project.slug,
      category: project.category,
      address: project.address,
      website: project.website,
    },
    trustScore: {
      overall: score,
      riskLevel,
      breakdown,
      recommendation: score >= 80 ? 'SAFE' : score >= 50 ? 'CAUTION' : 'AVOID',
    },
    reviews: {
      count: project.reviewCount,
      avgRating: project.avgRating,
      latest: project.reviews.map(r => ({
        rating: r.rating,
        content: r.content.slice(0, 200),
        reviewer: r.reviewer?.displayName || 'Anonymous',
        verified: !!r.txHash,
        date: r.createdAt,
      })),
    },
    aiAnalysis,
    metadata: {
      timestamp: new Date().toISOString(),
      agentId,
      queryType: paymentHeader ? 'paid' : 'free',
    },
  }

  // Add payment receipt if paid
  if (paymentResult?.valid) {
    response.payment = {
      protocol: 'x402',
      network: 'kite-testnet',
      from: paymentResult.from,
      amount: paymentResult.amount,
      currency: 'KITE',
      txHash: paymentResult.txHash,
      explorer: paymentResult.txHash ? getExplorerUrl(paymentResult.txHash) : null,
      status: 'settled',
    }
  }

  return NextResponse.json(response, {
    headers: {
      'X-Trust-Score': String(score),
      'X-Risk-Level': riskLevel,
      'X-Payment-Status': paymentResult?.valid ? 'paid' : 'free',
    },
  })
}
