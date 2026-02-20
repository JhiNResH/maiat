/**
 * One-time script to create the Hedera HCS topic for Maiat review attestations.
 * Run: npx tsx scripts/setup-hedera-topic.ts
 * Then add HEDERA_TOPIC_ID=<output> to .env
 */
import { createReviewTopic } from '../src/lib/hedera'

async function main() {
  console.log('Creating Hedera review attestation topic...')
  const topicId = await createReviewTopic()
  console.log(`\n✅ Topic created: ${topicId}`)
  console.log(`\nAdd to .env:\nHEDERA_TOPIC_ID=${topicId}`)
  console.log(`\nView on HashScan: https://hashscan.io/testnet/topic/${topicId}`)
}

main().catch(console.error)
