/**
 * Maiat Trust Score Oracle — Chainlink CRE Workflow
 *
 * This workflow orchestrates trust score verification for the Maiat platform:
 * 1. [Cron Trigger] Every 5 minutes, check for pending reviews
 * 2. [HTTP Fetch] Pull pending reviews from Maiat API (offchain data)
 * 3. [AI Verify] Send reviews to AI verification endpoint for quality scoring
 * 4. [Chain Write] Write verified trust scores to TrustScoreOracle on-chain
 *
 * Track: CRE & AI ($17k prize)
 * Hackathon: Chainlink Convergence (deadline Mar 1, 2026)
 */

import {
  CronCapability,
  HTTPClient,
  EVMClient,
  handler,
  consensusMedianAggregation,
  Runner,
  type NodeRuntime,
  type Runtime,
  getNetwork,
  LAST_FINALIZED_BLOCK_NUMBER,
  encodeCallMsg,
  bytesToHex,
  hexToBase64,
} from "@chainlink/cre-sdk"
import { encodeAbiParameters, parseAbiParameters, zeroAddress } from "viem"

// ─── Types ───────────────────────────────────────────────────────────────────

type EvmConfig = {
  chainName: string
  trustScoreOracleAddress: string
  gasLimit: string
}

type Config = {
  schedule: string
  maiatApiUrl: string
  aiVerifyUrl: string
  evms: EvmConfig[]
}

/** Review fetched from Maiat API */
type Review = {
  id: string
  projectId: string
  content: string
  rating: number
  authorAddress: string
}

/** AI verification result */
type VerificationResult = {
  reviewId: string
  projectId: string
  trustScore: bigint // 0-100
  isLegitimate: boolean
  confidence: bigint // 0-100
}

/** Final workflow output */
type WorkflowResult = {
  reviewsProcessed: bigint
  averageTrustScore: bigint
  txHash: string
}

// ─── Workflow Definition ─────────────────────────────────────────────────────

const initWorkflow = (config: Config) => {
  const cron = new CronCapability()
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}

// ─── Main Callback ───────────────────────────────────────────────────────────

const onCronTrigger = (runtime: Runtime<Config>): WorkflowResult => {
  const evmConfig = runtime.config.evms[0]

  runtime.log("🪲 Maiat Trust Score Oracle — Starting verification cycle")

  // Step 1: Fetch pending reviews from Maiat API
  // Each node fetches independently; we use median consensus on the count
  const pendingReviewsRaw = runtime.runInNodeMode(
    fetchPendingReviews,
    consensusMedianAggregation()
  )().result()

  runtime.log(`Fetched ${pendingReviewsRaw} pending reviews`)

  if (pendingReviewsRaw === 0n) {
    runtime.log("No pending reviews to process. Skipping cycle.")
    return {
      reviewsProcessed: 0n,
      averageTrustScore: 0n,
      txHash: "0x0",
    }
  }

  // Step 2: AI-verify reviews and get trust scores
  // Each node calls the AI verification endpoint; consensus on the aggregate score
  const aggregateTrustScore = runtime.runInNodeMode(
    verifyReviewsWithAI,
    consensusMedianAggregation()
  )().result()

  runtime.log(`AI verification complete. Aggregate trust score: ${aggregateTrustScore}`)

  // Step 3: Write verified trust score on-chain
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evmConfig.chainName,
    isTestnet: true,
  })

  if (!network) {
    throw new Error(`Unknown chain: ${evmConfig.chainName}`)
  }

  // Encode the trust score update for on-chain write
  const reportData = encodeAbiParameters(
    parseAbiParameters("uint256 reviewCount, uint256 avgTrustScore, uint256 timestamp"),
    [pendingReviewsRaw, aggregateTrustScore, BigInt(Math.floor(Date.now() / 1000))]
  )

  // Generate signed report
  const report = runtime.report(reportData)

  // Write to chain
  const evmClient = new EVMClient(network.chainSelector.selector)
  const txResult = evmClient.writeReport(runtime, {
    report,
    contractAddress: evmConfig.trustScoreOracleAddress as `0x${string}`,
    gasLimit: BigInt(evmConfig.gasLimit),
  }).result()

  const txHash = bytesToHex(txResult.txHash)
  runtime.log(`✅ Trust scores written on-chain. TX: ${txHash}`)

  return {
    reviewsProcessed: pendingReviewsRaw,
    averageTrustScore: aggregateTrustScore,
    txHash,
  }
}

// ─── Node-Mode Functions (run independently on each DON node) ────────────────

/**
 * Fetch pending reviews from Maiat API.
 * Returns the count of pending reviews as a bigint for consensus.
 */
const fetchPendingReviews = (nodeRuntime: NodeRuntime<Config>): bigint => {
  const httpClient = new HTTPClient()

  const resp = httpClient.sendRequest(nodeRuntime, {
    url: nodeRuntime.config.maiatApiUrl,
    method: "GET" as const,
    headers: {
      "Content-Type": "application/json",
    },
  }).result()

  const bodyText = new TextDecoder().decode(resp.body)

  try {
    const data = JSON.parse(bodyText)
    // API returns { reviews: [...], count: N }
    const count = data.count ?? data.reviews?.length ?? 0
    return BigInt(count)
  } catch {
    nodeRuntime.log(`Failed to parse Maiat API response: ${bodyText.substring(0, 200)}`)
    return 0n
  }
}

/**
 * Send reviews to AI verification endpoint and return aggregate trust score.
 * The AI endpoint analyzes review quality, detects spam/fakes, and returns scores.
 */
const verifyReviewsWithAI = (nodeRuntime: NodeRuntime<Config>): bigint => {
  const httpClient = new HTTPClient()

  // First, fetch the actual reviews
  const reviewResp = httpClient.sendRequest(nodeRuntime, {
    url: nodeRuntime.config.maiatApiUrl,
    method: "GET" as const,
    headers: { "Content-Type": "application/json" },
  }).result()

  const reviewBody = new TextDecoder().decode(reviewResp.body)
  let reviews: Review[] = []

  try {
    const data = JSON.parse(reviewBody)
    reviews = data.reviews ?? []
  } catch {
    return 50n // Default trust score if parsing fails
  }

  if (reviews.length === 0) {
    return 0n
  }

  // Send reviews to AI verification
  const verifyResp = httpClient.sendRequest(nodeRuntime, {
    url: nodeRuntime.config.aiVerifyUrl,
    method: "POST" as const,
    headers: { "Content-Type": "application/json" },
    body: new TextEncoder().encode(JSON.stringify({
      reviews: reviews.map(r => ({
        id: r.id,
        content: r.content,
        rating: r.rating,
        projectId: r.projectId,
      })),
    })),
  }).result()

  const verifyBody = new TextDecoder().decode(verifyResp.body)

  try {
    const result = JSON.parse(verifyBody)
    // AI endpoint returns { averageTrustScore: N, verifications: [...] }
    const score = result.averageTrustScore ?? result.score ?? 50
    return BigInt(Math.round(score))
  } catch {
    nodeRuntime.log(`Failed to parse AI verification response`)
    return 50n
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
