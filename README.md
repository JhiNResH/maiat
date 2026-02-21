# 🪲 Maiat — Trust Layer for Agentic Commerce

> **The reputation oracle AI agents need to transact safely.**

[![Live Demo](https://img.shields.io/badge/demo-maiat.vercel.app-blue)](https://maiat.vercel.app)
[![Telegram Bot](https://img.shields.io/badge/bot-@MaiatBot-26A5E4)](https://t.me/MaiatBot)
[![Hedera HCS](https://img.shields.io/badge/Hedera-Topic%200.0.7987770-purple)](https://hashscan.io/testnet/topic/0.0.7987770)
[![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-0052FF)](https://sepolia.basescan.org/address/0xa576088079Fe357eD4D8E96E90FeD9e8b11aAD8E)

---

## 🎯 Problem

AI agents will handle billions in transactions, but they have no way to verify trust. Fake reviews plague Web2. Crypto has no Yelp. Agents can't distinguish scams from legit protocols.

## 💡 Solution

Maiat provides **verified, on-chain trust scores** for crypto projects and AI agents — queryable by both humans and autonomous agents.

```
Human asks @MaiatBot → "Is Jerry's Coffee trustworthy?"
Bot returns → Verified reviews + trust scores + on-chain attestations
Human visits → Bot prompts for review
Review submitted → 0G AI verifies → Hedera HCS attests → Trust score updates
Agent queries → Pays via x402 on Kite → Gets trust report → Decides autonomously
```

---

## 🏆 ETHDenver 2026 BUIDLathon

**Track:** Futurllama — Frontier Tech & Wild Ideas

| Bounty | Integration | Prize |
|--------|-------------|-------|
| **0G** | Decentralized AI review verification (TeeML) | $25,000 |
| **KiteAI** | x402 agent micropayments for trust queries | $10,000 |
| **Base** | Autonomous agent + Base Verify + ERC-8021 Builder Codes + ACP | $10,000 |
| **Hedera** | HCS immutable review attestations | $10,000 |
| **Uniswap** | Trading API + V4 Hook (trust-gated swaps + dynamic fees) | $5,000 |

---

## 🔗 Deployed Contracts (Base Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| **TrustScoreOracle** | `0xa576088079Fe357eD4D8E96E90FeD9e8b11aAD8E` | [BaseScan](https://sepolia.basescan.org/address/0xa576088079Fe357eD4D8E96E90FeD9e8b11aAD8E) |
| **TrustGateHook** | `0x31c8E89a7A6aDcB3DcD07e3306461b64674D5da4` | [BaseScan](https://sepolia.basescan.org/address/0x31c8E89a7A6aDcB3DcD07e3306461b64674D5da4) |

**ERC-8021 Builder Code TX:** [`0x44deb737...`](https://sepolia.basescan.org/tx/0x44deb73751a80a7ab3a457bb4dfe407ca3eaf878430c7c5a9c042f95624963d5) — builder code `bc_cozhkj23` visible in calldata suffix

**Seeded token scores:** WETH=97, USDC=92, DAI=88 | Trust threshold: 30

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                      MAIAT                           │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐    │
│  │ Web App  │  │ Telegram │  │  Trust Score    │    │
│  │ Next.js  │  │   Bot    │  │     API         │    │
│  └────┬─────┘  └────┬─────┘  └──────┬─────────┘    │
│       │              │               │               │
│  ┌────▼──────────────▼───────────────▼───────────┐  │
│  │            Verification Engine                 │  │
│  │                                                │  │
│  │  ┌─────┐  ┌──────┐  ┌──────┐  ┌───────┐      │  │
│  │  │ 0G  │  │ Kite │  │ Base │  │Hedera │      │  │
│  │  │ AI  │  │ x402 │  │Verify│  │  HCS  │      │  │
│  │  └─────┘  └──────┘  └──────┘  └───────┘      │  │
│  └────────────────────┬──────────────────────────┘  │
│                       │                              │
│  ┌────────────────────▼──────────────────────────┐  │
│  │         Supabase (PostgreSQL)                  │  │
│  │  Projects · Reviews · Users · Trust Scores     │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │                               │
│  ┌───────────────────▼───────────────────────────┐  │
│  │    Uniswap V4 Hook + ACP Agent (Base)         │  │
│  │                                                │  │
│  │  TrustScoreOracle    TrustGateHook    ACP     │  │
│  │  ├─ Token scores     ├─ beforeSwap    Agent   │  │
│  │  ├─ User reputation  ├─ Dynamic fee   Wallet  │  │
│  │  └─ ERC-8021 suffix  └─ Revert <30   0xAf1a  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🔵 0G — Decentralized AI Review Verification

**What:** Every review is verified by AI models running on 0G Compute Network — not our servers.

**How:** Reviews are sent to 0G nodes running Qwen 2.5 via the 0G Serving Broker SDK. Each review gets a score 0-100. Spam is flagged. Inference runs in TEEs with TeeML attestation.

**Live demo:**
```bash
# Fake review → spam
curl -X POST https://maiat.vercel.app/api/verify-0g \
  -H "Content-Type: application/json" \
  -d '{"title":"Amazing coffee","content":"Best coffee ever 5 stars highly recommend everyone should go","rating":5,"category":"restaurant"}'
# → score: 23, verdict: "spam"

# Real review → authentic
curl -X POST https://maiat.vercel.app/api/verify-0g \
  -H "Content-Type: application/json" \
  -d '{"title":"Best latte in Denver","content":"Stopped by Jerry Coffee during ETHDenver. Got the oat milk latte and a croissant. The latte was perfectly balanced, not too bitter. Cozy space, fast wifi, friendly staff.","rating":4,"category":"restaurant"}'
# → score: 82, verdict: "authentic"
```

**Code:**
- `src/lib/0g-compute.ts` — 0G Serving Broker SDK integration
- `src/app/api/verify-0g/route.ts` — Verification API endpoint
- SDK: `@0glabs/0g-serving-broker`
- Network: 0G Testnet (`https://evmrpc-testnet.0g.ai`)

---

## 🟢 KiteAI — x402 Agent Micropayments

**What:** AI agents autonomously pay for trust intelligence via HTTP 402 protocol on Kite Chain.

**How:** Agent hits API → gets 402 Payment Required → signs EIP-712 payment (0.001 KITE) → retries with `X-Payment` header → receives full trust report. Real on-chain settlement.

**Live demo:**
```bash
cd scripts
npx tsx demo-agent-x402.ts jerrys-coffee
# → Agent pays 0.001 KITE → gets trust report (score: 45, risk: HIGH)
# → Real tx on KiteScan: https://testnet.kitescan.ai/tx/0x928d...
# → Agent decision: BLOCK — trust too low
```

**Code:**
- `src/lib/kite-x402.ts` + `src/lib/x402.ts` — x402 protocol implementation
- `src/app/api/verify-kite/route.ts` — Payment verification API
- `src/app/api/x402/trust-score/route.ts` — Paid trust score endpoint
- `scripts/demo-agent-x402.ts` — Full agent demo script
- `src/app/x402-demo/page.tsx` — Frontend demo page
- Network: Kite Testnet (Chain 2368, `https://rpc-testnet.gokite.ai`)

---

## 🔵 Base — Autonomous Agent + Identity + ERC-8021

**What:** Autonomous agent on Base with anti-Sybil identity, on-chain trust contracts, and ERC-8021 builder code attribution.

### 1. Autonomous Agent (Virtuals ACP)
- Agent wallet on Base: `0xAf1aE6F344c60c7Fe56CB53d1809f2c0B997a2b9`
- Registered on Virtuals Agent Commerce Protocol
- Sells trust score queries (`0.01 VIRTUAL/query`) to other agents
- Deployed on Railway 24/7

```bash
cd virtuals-acp
npx acp whoami          # Agent identity
npx acp wallet address  # Base wallet
cat offerings/trust-score/offering.json  # Marketplace offering
```

### 2. Privy Server Wallet
- `src/lib/agent-wallet.ts` — Agent signs reviews + pays fees autonomously
- No human holds the private key

### 3. Base Verify (Anti-Sybil)
- Users connect X/Coinbase/Instagram via Base Verify Mini App
- Same social account = same deterministic verification token
- Unique constraint prevents multi-wallet Sybil attacks
- Verified users get "Verified Human" badge + higher review weight
- `src/components/BaseVerifyButton.tsx` + `src/app/api/verify-base/route.ts`

### 4. On-Chain Contracts (Base Sepolia)
- **TrustScoreOracle** — Token trust scores + user reputation
- **TrustGateHook** — Uniswap V4 `beforeSwap` hook
- Both deployed and seeded with live data

### 5. ERC-8021 Builder Codes
- **App registration:** `base:app_id: 699600ef25337829d86a5475` + `base:bounty_code: bc_cozhkj23` in `src/app/layout.tsx`
- **On-chain attribution:** `dataSuffix` on viem walletClient in `src/lib/onchain.ts` — every agent transaction appends builder code + `0x8021...` marker to calldata
- **Proof TX:** [`0x44deb737...`](https://sepolia.basescan.org/tx/0x44deb73751a80a7ab3a457bb4dfe407ca3eaf878430c7c5a9c042f95624963d5) — inspect Input Data to see `bc_cozhkj23` + ERC-8021 marker

### 6. Uniswap Trading API on Base
- Swap interface queries Uniswap Trading API on Base (chainId 8453)
- Trust data overlaid on every quote

---

## 🟣 Hedera — Immutable Review Attestations

**What:** Every verified review gets recorded on Hedera Consensus Service as an immutable, ordered message.

**How:** Review data (content hash, trust score, verification status, reviewer) is submitted to HCS Topic `0.0.7987770`. Any agent can subscribe for real-time updates.

**Live demo:**
```bash
curl -X POST https://maiat.vercel.app/api/hedera/attest \
  -H "Content-Type: application/json" \
  -d '{"reviewId":"cmlw5ve6l001cl850a6ec7316"}'
# → topicId: 0.0.7987770, sequenceNumber: 2
# → https://hashscan.io/testnet/topic/0.0.7987770
```

**Code:**
- `src/lib/hedera.ts` — Hedera SDK integration (HCS messaging)
- `src/app/api/hedera/attest/route.ts` — Attestation API
- `scripts/setup-hedera-topic.ts` — Topic initialization
- SDK: `@hashgraph/sdk`

---

## 🔴 Uniswap — Trust-Gated Swaps + Dynamic Fees

**What:** Two layers of Uniswap integration — Trading API for UX, V4 Hook for on-chain enforcement.

### Layer 1: Trading API (Off-chain)
- `/api/swap` queries community reviews before fetching Uniswap quote
- Trust score < 30 → swap blocked
- Trust score 30-60 → warning displayed
- Real-time quotes from Uniswap Trading API on Base (chainId 8453)
- 8 tokens supported: ETH, USDC, WETH, DAI, cbBTC, AERO, DEGEN, USDT

### Layer 2: V4 Hook (On-chain)
- `TrustGateHook` — `beforeSwap` hook queries `TrustScoreOracle`
- Token score < 30 → transaction reverts (`TrustScoreTooLow`)
- Dynamic fees based on user reputation:

| Tier | Reputation | Fee |
|------|-----------|-----|
| Guardian | 200+ | 0% |
| Verified | 50+ | 0.1% |
| Trusted | 10+ | 0.3% |
| New | 0-9 | 0.5% |

**Write reviews → build reputation → pay less to swap. Reviews have real economic value.**

**Code:**
- `src/lib/uniswap.ts` — Trading API integration
- `src/app/api/swap/route.ts` — Trust-gated swap endpoint
- `src/components/SwapWidget.tsx` — Swap UI with trust overlay
- `src/app/swap/page.tsx` — Swap page
- `contracts/src/TrustGateHook.sol` — V4 Hook (beforeSwap + dynamic fee)
- `contracts/src/TrustScoreOracle.sol` — On-chain oracle
- `contracts/test/` — 51 tests (unit + fuzz), all passing

**Deploy + interact:**
```bash
cd contracts

# Deploy
forge script script/Deploy.s.sol \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY --broadcast -vvvv

# Seed scores
ORACLE_ADDRESS=0xa576... forge script script/Interact.s.sol:SeedScores \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY --broadcast -vvvv

# Read on-chain state
ORACLE_ADDRESS=0xa576... HOOK_ADDRESS=0x31c8... \
forge script script/Interact.s.sol:ReadState \
  --rpc-url https://sepolia.base.org -vvvv
```

---

## 🤖 Telegram Bot (@MaiatBot)

Full review lifecycle without leaving Telegram:

| Command | Action |
|---------|--------|
| `/start` | Welcome + quick actions |
| `/recommend coffee` | Top recommendations with trust scores |
| `/review` | Select project → rate → write review |
| `/demo_purchase` | Simulate a purchase for demo |

---

## 🪲 Scarab Points System

Off-chain incentive layer that rewards quality contributions and gates spam:

| Action | Scarab |
|--------|--------|
| Initial claim | +20 |
| Daily claim | +5 (streak bonus) |
| Write a review | -2 |
| Vote on a review | -5 |
| Purchase (USDC) | $1=50 / $5=300 / $20=1,500 |

Scarab feeds into on-chain reputation → lower swap fees on Uniswap V4.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS, Privy |
| Backend | Next.js API Routes, Prisma ORM |
| Database | Supabase (PostgreSQL) |
| AI Verification | 0G Compute Network (Qwen 2.5, TeeML) |
| Agent Payments | KiteAI x402 (Kite Testnet) |
| Identity | Base Verify (anti-Sybil) |
| Attestations | Hedera HCS |
| Swaps | Uniswap Trading API + V4 Hook |
| Agent Commerce | Virtuals ACP (Base) |
| Smart Contracts | Solidity 0.8.26, Foundry |
| Attribution | ERC-8021 Builder Codes |
| Bot | Telegram Bot API |
| Hosting | Vercel + Railway |

---

## 📂 Project Structure

```
maiat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── verify-0g/         # 0G AI verification
│   │   │   ├── verify-kite/       # KiteAI x402 payment
│   │   │   ├── verify-base/       # Base Verify (anti-sybil)
│   │   │   ├── x402/trust-score/  # Paid trust score API
│   │   │   ├── hedera/attest/     # Hedera HCS attestation
│   │   │   ├── swap/              # Trust-gated Uniswap swap
│   │   │   ├── reviews/           # Review CRUD
│   │   │   └── telegram-webhook/  # Bot handler
│   │   ├── swap/page.tsx          # Swap UI
│   │   ├── x402-demo/page.tsx     # x402 demo page
│   │   └── layout.tsx             # ERC-8021 builder code metadata
│   ├── lib/
│   │   ├── 0g-compute.ts          # 0G Serving Broker SDK
│   │   ├── kite-x402.ts           # x402 protocol
│   │   ├── hedera.ts              # Hedera HCS SDK
│   │   ├── uniswap.ts             # Uniswap Trading API
│   │   ├── onchain.ts             # Base Sepolia + ERC-8021 dataSuffix
│   │   ├── agent-wallet.ts        # Privy server wallet
│   │   └── trust-score.ts         # Trust score algorithm
│   └── components/
│       ├── BaseVerifyButton.tsx    # Base Verify
│       └── SwapWidget.tsx          # Trust-gated swap UI
├── contracts/
│   ├── src/
│   │   ├── TrustGateHook.sol      # Uniswap V4 beforeSwap hook
│   │   └── TrustScoreOracle.sol   # On-chain trust oracle
│   ├── test/                       # 51 tests (unit + fuzz)
│   └── script/
│       ├── Deploy.s.sol           # Deploy to Base Sepolia
│       └── Interact.s.sol         # Seed, update, read state
├── virtuals-acp/                   # ACP agent (Base)
│   ├── offerings/
│   │   ├── trust-score/            # Trust score offering
│   │   └── deep-insight/           # Deep insight offering
│   └── config.json                 # Agent ID 3723, wallet 0xAf1a...
├── scripts/
│   └── demo-agent-x402.ts         # Agent x402 demo
└── bot/                            # Telegram bot
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/JhiNResH/maiat.git
cd maiat
npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run dev
```

---

## 🌐 Live Links

- **Web App:** [maiat.vercel.app](https://maiat.vercel.app)
- **Telegram Bot:** [@MaiatBot](https://t.me/MaiatBot)
- **Hedera Topic:** [0.0.7987770](https://hashscan.io/testnet/topic/0.0.7987770)
- **Base Contracts:** [TrustScoreOracle](https://sepolia.basescan.org/address/0xa576088079Fe357eD4D8E96E90FeD9e8b11aAD8E) · [TrustGateHook](https://sepolia.basescan.org/address/0x31c8E89a7A6aDcB3DcD07e3306461b64674D5da4)
- **ERC-8021 Proof TX:** [0x44deb737...](https://sepolia.basescan.org/tx/0x44deb73751a80a7ab3a457bb4dfe407ca3eaf878430c7c5a9c042f95624963d5)
- **KiteScan TX:** [0x928d9d5a...](https://testnet.kitescan.ai/tx/0x928d9d5ad7002ff90d3c01c1198df4fa2b4f9c69d1c6c1d09dd4d59ee7713186)
- **GitHub:** [github.com/JhiNResH/maiat](https://github.com/JhiNResH/maiat)

---

## 👥 Team

**JhiNResH** — Builder
Blockchain developer with multiple hackathon wins across Solana and EVM ecosystems.

---

## 📄 License

MIT
