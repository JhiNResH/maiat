/**
 * Hedera Integration for Maiat
 * 
 * Uses Hedera Consensus Service (HCS) for immutable review attestations.
 * Each verified review gets recorded as an HCS message with:
 * - Review content hash
 * - Trust score
 * - Verification status
 * - Reviewer identity (pseudonymous)
 * 
 * This creates an immutable, ordered log of all review verifications
 * that any agent or application can subscribe to.
 */

import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  AccountId,
  PrivateKey,
} from '@hashgraph/sdk'

// Hedera Testnet config
const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID || ''
const HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY || ''

// Maiat review attestation topic (set after first creation)
let REVIEW_TOPIC_ID = process.env.HEDERA_TOPIC_ID || ''

let clientInstance: Client | null = null

function getClient(): Client {
  if (clientInstance) return clientInstance

  if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) {
    throw new Error('HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY required')
  }

  clientInstance = Client.forTestnet()
  clientInstance.setOperator(
    AccountId.fromString(HEDERA_ACCOUNT_ID),
    PrivateKey.fromStringECDSA(HEDERA_PRIVATE_KEY)
  )
  
  return clientInstance
}

/**
 * Create a new HCS topic for Maiat review attestations
 * Only needs to be called once — save the topic ID in env
 */
export async function createReviewTopic(): Promise<string> {
  const client = getClient()

  const tx = new TopicCreateTransaction()
    .setTopicMemo('Maiat Review Attestations — Trust Layer for Agentic Commerce')

  const response = await tx.execute(client)
  const receipt = await response.getReceipt(client)
  const topicId = receipt.topicId!.toString()

  console.log('[Hedera] Created review topic:', topicId)
  REVIEW_TOPIC_ID = topicId
  return topicId
}

/**
 * Submit a review attestation to HCS
 * Creates an immutable record of the review verification
 */
export async function submitReviewAttestation(params: {
  reviewId: string
  projectName: string
  projectSlug: string
  reviewer: string
  rating: number
  contentHash: string // SHA-256 of review content
  trustScore: number
  verificationStatus: 'verified' | 'suspicious' | 'pending'
  aiScore?: number // 0G AI quality score
  kiteChainTx?: string // KiteAI verification tx
}): Promise<{ topicId: string; sequenceNumber: number; timestamp: string }> {
  const client = getClient()

  if (!REVIEW_TOPIC_ID) {
    throw new Error('HEDERA_TOPIC_ID not set — run createReviewTopic() first')
  }

  const attestation = {
    version: '1.0',
    type: 'maiat-review-attestation',
    ...params,
    timestamp: new Date().toISOString(),
    network: {
      hedera: 'testnet',
      topicId: REVIEW_TOPIC_ID,
    },
  }

  const message = JSON.stringify(attestation)

  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(REVIEW_TOPIC_ID))
    .setMessage(message)

  const response = await tx.execute(client)
  const receipt = await response.getReceipt(client)

  const result = {
    topicId: REVIEW_TOPIC_ID,
    sequenceNumber: receipt.topicSequenceNumber?.toNumber() || 0,
    timestamp: new Date().toISOString(),
  }

  console.log('[Hedera] Review attestation submitted:', result)
  return result
}

/**
 * Submit an agent trust query attestation
 * Records when an agent queries Maiat for trust scores
 */
export async function submitAgentQueryAttestation(params: {
  agentId: string
  projectQueried: string
  trustScoreReturned: number
  queryType: 'trust-score' | 'recommendation' | 'verification'
}): Promise<{ topicId: string; sequenceNumber: number }> {
  const client = getClient()

  if (!REVIEW_TOPIC_ID) {
    throw new Error('HEDERA_TOPIC_ID not set')
  }

  const attestation = {
    version: '1.0',
    type: 'maiat-agent-query',
    ...params,
    timestamp: new Date().toISOString(),
  }

  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(REVIEW_TOPIC_ID))
    .setMessage(JSON.stringify(attestation))

  const response = await tx.execute(client)
  const receipt = await response.getReceipt(client)

  return {
    topicId: REVIEW_TOPIC_ID,
    sequenceNumber: receipt.topicSequenceNumber?.toNumber() || 0,
  }
}

/**
 * Create a content hash for review attestation
 */
export function hashReviewContent(content: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(content).digest('hex')
}
