#!/usr/bin/env npx tsx
// Run: npx tsx scripts/setup-0g.ts
// Prerequisite: Get testnet tokens from https://faucet.0g.ai

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { setup0GAccount } from '../src/lib/0g-compute'

async function main() {
  console.log('🔧 Setting up 0G Compute account...')
  console.log('RPC: https://evmrpc-testnet.0g.ai')
  
  await setup0GAccount(0.05) // deposit 0.05 OG tokens (faucet limit)
  
  console.log('\n✅ 0G account ready! You can now use /api/verify-0g')
}

main().catch(console.error)
