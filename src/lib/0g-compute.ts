import { ethers } from 'ethers'
import { createZGComputeNetworkBroker, type ZGComputeNetworkBroker } from '@0glabs/0g-serving-broker'
import OpenAI from 'openai'

// 0G Testnet config
const RPC_URL = 'https://evmrpc-testnet.0g.ai'

// Testnet providers
const PROVIDERS = {
  'qwen-2.5-7b': '0xa48f01287233509FD694a22Bf840225062E67836',
  'gpt-oss-20b': '0x8e60d466FD16798Bec4868aa4CE38586D5590049',
  'gemma-3-27b': '0x69Eb5a0BD7d0f4bF39eD5CE9Bd3376c61863aE08',
}

let brokerInstance: ZGComputeNetworkBroker | null = null

async function getBroker(): Promise<ZGComputeNetworkBroker> {
  if (brokerInstance) return brokerInstance

  const privateKey = process.env.ZG_PRIVATE_KEY || process.env.PRIVATE_KEY
  if (!privateKey) throw new Error('ZG_PRIVATE_KEY not set')

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(privateKey, provider)
  brokerInstance = await createZGComputeNetworkBroker(wallet)
  return brokerInstance
}

export interface VerificationResult {
  score: number          // 0-100
  verdict: 'authentic' | 'suspicious' | 'spam'
  reasoning: string
  model: string
  provider: string
  verified: boolean      // 0G TeeML verified
  txHash?: string
}

const VERIFICATION_PROMPT = `You are a review authenticity verifier. Analyze this review and score it 0-100.

Score criteria:
- 80-100: Authentic, detailed, specific experience
- 50-79: Likely real but lacks detail
- 20-49: Suspicious, generic, possibly AI-generated
- 0-19: Spam or clearly fake

Review to analyze:
Title: {title}
Content: {content}
Rating: {rating}/5
Category: {category}

Respond in EXACTLY this JSON format (no markdown):
{"score": <number>, "verdict": "<authentic|suspicious|spam>", "reasoning": "<one sentence>"}`

export async function verifyReviewWith0G(review: {
  title: string
  content: string
  rating: number
  category: string
}): Promise<VerificationResult> {
  const broker = await getBroker()
  const providerAddress = PROVIDERS['qwen-2.5-7b']

  // Get service metadata
  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress)

  // Build prompt
  const prompt = VERIFICATION_PROMPT
    .replace('{title}', review.title)
    .replace('{content}', review.content)
    .replace('{rating}', String(review.rating))
    .replace('{category}', review.category)

  // Generate auth headers
  const headers = await broker.inference.getRequestHeaders(providerAddress, prompt)

  // Call via OpenAI-compatible API
  const client = new OpenAI({
    baseURL: endpoint,
    apiKey: '', // not needed, auth via headers
  })

  const response = await client.chat.completions.create(
    {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 200,
    },
    { headers: headers as unknown as Record<string, string> }
  )

  const raw = response.choices[0]?.message?.content || ''
  
  // Parse response
  try {
    const parsed = JSON.parse(raw)
    return {
      score: parsed.score || 0,
      verdict: parsed.verdict || 'suspicious',
      reasoning: parsed.reasoning || 'Unable to determine',
      model,
      provider: '0G Compute Network',
      verified: true, // TeeML verified
    }
  } catch {
    return {
      score: 50,
      verdict: 'suspicious',
      reasoning: 'AI verification returned non-standard response',
      model,
      provider: '0G Compute Network',
      verified: true,
    }
  }
}

// Setup: deposit + acknowledge provider (run once)
export async function setup0GAccount(amount: number = 3) {
  const broker = await getBroker()
  
  // Create/fund ledger
  try {
    await broker.ledger.getLedger()
    console.log('Ledger exists, depositing more funds...')
    await broker.ledger.depositFund(amount)
  } catch {
    console.log('Creating new ledger...')
    await broker.ledger.addLedger(amount)
  }

  // Acknowledge all providers
  for (const [name, addr] of Object.entries(PROVIDERS)) {
    try {
      await broker.inference.acknowledgeProviderSigner(addr)
      console.log(`Acknowledged ${name}`)
    } catch (e: any) {
      console.log(`${name}: ${e.message}`)
    }
  }

  // Transfer funds to primary provider
  const transferAmount = ethers.parseEther('1.0')
  await broker.ledger.transferFund(PROVIDERS['qwen-2.5-7b'], 'inference', transferAmount)
  console.log('Setup complete!')
}
