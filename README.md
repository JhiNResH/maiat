# 🪲 Maiat — Trust Layer for Agentic Commerce

> **The reputation oracle AI agents need to transact safely.**

[![Live Demo](https://img.shields.io/badge/demo-maiat.vercel.app-blue)](https://maiat.vercel.app)
[![Telegram Bot](https://img.shields.io/badge/bot-@MaiatBot-26A5E4)](https://t.me/MaiatBot)
[![Hedera HCS](https://img.shields.io/badge/Hedera-Topic%200.0.7987770-purple)](https://hashscan.io/testnet/topic/0.0.7987770)

---

## 🎯 Problem

AI agents will handle billions in transactions, but they have no way to verify trust. Fake reviews plague Web2. Crypto has no Yelp. Agents can't distinguish scams from legit protocols.

## 💡 Solution

Maiat provides **verified, on-chain trust scores** for crypto projects and AI agents — queryable by both humans and autonomous agents.

```
Human asks @MaiatBot → "Which coffee shop is best?"
Bot returns → Verified reviews + trust scores + on-chain attestations
Human buys → Bot prompts for review
Review submitted → 0G AI verifies → KiteAI records on-chain → Hedera HCS attests
Next person asks → Your verified review helps them decide
```

---

## 🏆 ETHDenver Bounties

| Bounty | Integration | Prize |
|--------|-------------|-------|
| **0G** | AI-powered review verification via 0G Compute Network | $25,000 |
| **KiteAI** | x402 micropayment protocol for agent-to-agent verification | $10,000 |
| **Base** | Base Verify (anti-sybil) + on-chain identity | $10,000 |
| **Hedera/OpenClaw** | HCS attestations for immutable review records | $10,000 |
| **Uniswap** | Trading API integration + V4 Hook (trust-gated swaps + dynamic fees) | $5,000 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   MAIAT                          │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Web App  │  │ Telegram │  │  Trust Score  │  │
│  │ Next.js  │  │   Bot    │  │     API       │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │               │           │
│  ┌────▼──────────────▼───────────────▼───────┐  │
│  │            Verification Engine             │  │
│  │                                            │  │
│  │  ┌─────┐  ┌──────┐  ┌──────┐  ┌───────┐  │  │
│  │  │ 0G  │  │ Kite │  │ Base │  │Hedera │  │  │
│  │  │ AI  │  │ x402 │  │Verify│  │  HCS  │  │  │
│  │  └─────┘  └──────┘  └──────┘  └───────┘  │  │
│  └────────────────────┬──────────────────────┘  │
│                       │                          │
│  ┌────────────────────▼──────────────────────┐  │
│  │         Supabase (PostgreSQL)              │  │
│  │  Projects · Reviews · Users · Trust Scores │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                           │
│  ┌───────────────────▼───────────────────────┐  │
│  │        Uniswap V4 Hook Layer              │  │
│  │                                            │  │
│  │  TrustScoreOracle    TrustGateHook        │  │
│  │  ├─ Token scores     ├─ beforeSwap gate   │  │
│  │  ├─ User reputation  ├─ Dynamic fee (bps) │  │
│  │  └─ Batch updates    └─ Revert if <30     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Chain Integrations

### 0G Compute Network — AI Review Verification
- **What:** Decentralized AI inference to detect fake/spam reviews
- **How:** Reviews are analyzed by 0G-hosted models (Qwen 2.5, GPT-OSS, Gemma 3) for quality scoring
- **Endpoint:** `POST /api/verify-0g`
- **SDK:** `@0glabs/0g-serving-broker`
- **Network:** 0G Testnet (`https://evmrpc-testnet.0g.ai`)

### KiteAI x402 — Agent Micropayments
- **What:** AI agents pay per verification via HTTP 402 protocol
- **How:** MaiatBot autonomously pays for deep review verification on Kite chain
- **Endpoint:** `POST /api/verify-kite`
- **Network:** Kite Testnet (Chain 2368, `https://rpc-testnet.gokite.ai`)
- **Explorer:** [testnet.kitescan.ai](https://testnet.kitescan.ai)
- Real on-chain transactions with verification data in calldata

### Base — Identity & Anti-Sybil
- **What:** Base Verify for human verification + SIWE authentication
- **How:** Users prove humanity via Base Verify Mini App → "Verified Human" badge on profile and reviews
- **Endpoint:** `POST /api/verify-base`
- **App ID:** `699600ef25337829d86a5475`
- **Chain:** Base Sepolia (84532)

**Full Flow:**
```
User clicks "Verify Human"
  → Signs SIWE message via Privy wallet (Base mainnet, chainId 8453)
  → Backend validates signature with viem.verifyMessage()
  → Calls Base Verify API (verify.base.dev) with provider + traits
  → API returns deterministic verificationToken (same social = same token)
  → Token stored in DB with UNIQUE constraint → prevents multi-wallet Sybil
  → User gets "Verified Human" badge (✓) on all reviews
```

**Supported Identity Providers:**
| Provider | Trait verified |
|----------|---------------|
| X (Twitter) | Account ownership |
| Coinbase One | KYC'd identity |
| Instagram | Social presence |
| TikTok | Social presence |

**Sybil Resistance Design:**
- `verificationToken` is deterministic: same social account always returns the same token
- Unique DB constraint on `verificationToken` → one human = one wallet
- On-chain: reputation scores weighted by verified status (`isVerified` flag on reviews)
- Unverified reviews have lower weight in trust score calculation

**Components:**
- `src/components/BaseVerifyButton.tsx` — SIWE signing + Mini App redirect
- `src/app/api/verify-base/route.ts` — Signature validation + Base Verify API call
- `src/app/api/verify-interaction/route.ts` — On-chain interaction proof

```bash
# Verify human identity
curl -X POST https://maiat.vercel.app/api/verify-base \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "signature": "0x...",
    "message": { "chainId": 8453, "statement": "Verify your identity with Base Verify for Maiat.", ... },
    "provider": "x"
  }'

# Response
{
  "verified": true,
  "verificationToken": "base-x-abc123...",
  "badge": "Verified Human",
  "provider": "x",
  "traits": { "verified": true }
}
```

### Hedera Consensus Service — Immutable Attestations
- **What:** Every verified review creates an immutable HCS attestation
- **How:** Review data hashed + recorded as ordered HCS messages
- **Topic:** [`0.0.7987770`](https://hashscan.io/testnet/topic/0.0.7987770)
- **Endpoint:** `POST /api/hedera/attest`
- **SDK:** `@hashgraph/sdk`
- Any agent can subscribe to the topic for real-time trust updates

---

## 🤖 Telegram Bot (@MaiatBot)

Full review lifecycle without leaving Telegram:

| Command | Action |
|---------|--------|
| `/start` | Welcome + quick actions |
| `/recommend coffee` | Top recommendations with trust scores |
| `/review` | Select project → rate → write review |
| `"best coffee"` | Natural language recommendation |

**Review Flow:**
1. User selects project → rates (⭐1-5) → writes review
2. **0G AI** analyzes quality → score/100
3. **KiteAI** records on-chain → tx hash
4. **Hedera HCS** creates attestation → sequence number
5. Bot sends verification card with all proofs

---

### Uniswap V4 Hook — Trust-Gated Swaps + Dynamic Fees

**The core innovation:** A Uniswap V4 `beforeSwap` hook that enforces trust scores on-chain and adjusts fees based on user reputation.

**How it works:**

```
User initiates swap
  → TrustGateHook.beforeSwap() fires
    → Reads TrustScoreOracle for token trust score
    → Score < 30? REVERT (blocked)
    → Score ≥ 30? Check user reputation
      → Guardian (200+ rep): 0% fee
      → Verified (50+ rep):  0.1% fee
      → Trusted (10+ rep):   0.3% fee
      → New user:            0.5% fee
    → Returns dynamic fee override to V4 pool
```

**Smart Contracts:**
- **`TrustGateHook.sol`** — V4 hook: `beforeSwap` checks token trust + returns reputation-based `lpFeeOverride`
- **`TrustScoreOracle.sol`** — On-chain oracle storing token scores (from community reviews) + user reputation (from Scarab points)

**Off-chain flow (Web + Telegram):**
- `POST /api/swap` → queries Maiat DB for real community reviews → gets Uniswap API quote
- Every token is a reviewable project — community ratings directly feed the trust score
- User's Scarab points + review history → reputation tier → fee discount shown in UI

**Key features:**
- Token scores sourced from **real community reviews** (not static data)
- Reputation-based dynamic fees — **write reviews, get cheaper swaps**
- `GET /api/reputation?address=0x...` — query any user's trust level + fee tier
- 8 Base tokens supported: ETH, USDC, WETH, DAI, cbBTC, AERO, DEGEN, USDT

**Contract Tests (54/54 passing):**
```bash
cd contracts
forge test -v
# TrustScoreOracle.t.sol: 22 tests (unit + 3 fuzz)
# TrustGateHook.t.sol:    29 tests (unit + 3 fuzz, including dynamic fee tiers)
```

**Deploy to Base Sepolia:**
```bash
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast --verify \
  --etherscan-api-key $BASESCAN_API_KEY -vvvv

# Seed token trust scores
ORACLE_ADDRESS=0x... forge script script/Interact.s.sol:SeedScores \
  --rpc-url $BASE_SEPOLIA_RPC --private-key $PRIVATE_KEY --broadcast
```

```bash
# Trust-gated swap with reputation fees
curl -X POST https://maiat.vercel.app/api/swap \
  -H "Content-Type: application/json" \
  -d '{"tokenIn":"0x000...","tokenOut":"0x4ed...","amount":"1000000000000000000","chainId":8453,"swapper":"0x..."}'

# Response includes: trustScore, tokenReviews, userReputation, fees
```

---

## 🤖 Virtuals ACP — Agent Commerce Protocol

Maiat is a **seller agent** on the Virtuals Agent Commerce Protocol, allowing any AI agent to programmatically query trust scores and pay per request.

**Offering: `trust_score_query`**
- **Fee:** 0.01 USDC per query (fixed)
- **Deployed:** Railway (24/7)
- **Network:** Base Mainnet

**How agents use it:**
1. Agent discovers Maiat's offering via ACP registry
2. Sends job request with `{ "project": "uniswap" }`
3. Pays 0.01 USDC via ACP
4. Receives: trust score, risk level, review count, sentiment, strengths, concerns

```
virtuals-acp/
├── src/seller/
│   ├── offerings/maiat/
│   │   ├── trust_score_query/   # Trust score lookup
│   │   └── deep_insight_report/ # Detailed analysis
│   └── runtime/                 # ACP socket + seller logic
└── bin/acp.ts                   # CLI tool
```

This is the **"agentic commerce"** layer — AI agents pay Maiat for trust intelligence before making decisions on behalf of users.

---

## 🪲 Scarab Points System

Scarab is Maiat's off-chain incentive layer that rewards quality contributions:

| Action | Scarab |
|--------|--------|
| Initial claim | +20 |
| Daily claim | +5 (streak bonus: +1/day, max +5) |
| Write a review | -2 |
| Vote on a review | -5 |
| Purchase (USDC) | $1=50 / $5=300 / $20=1,500 |

**First-week 2x boost** on all earning actions.

**Endpoints:**
- `GET /api/scarab/balance?address=0x...` — Check balance
- `POST /api/scarab/claim` — Daily claim
- `POST /api/scarab/purchase` — Buy Scarab with USDC
- `GET /api/scarab/history?address=0x...` — Transaction history

Scarab gates review/vote actions, creating a cost to spam while rewarding genuine participation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS, Privy (wallet auth) |
| Backend | Next.js API Routes, Prisma ORM |
| Database | Supabase (PostgreSQL) |
| AI | 0G Compute Network, Gemini 2.0 Flash |
| Blockchain | Base, Kite Testnet, Hedera Testnet, BSC |
| Bot | Telegram Bot API (webhook) |
| Hosting | Vercel |

---

## 📂 Project Structure

```
maiat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── telegram-webhook/  # Telegram bot handler
│   │   │   ├── trust-score/       # Trust score API (agent-queryable)
│   │   │   ├── verify-0g/         # 0G AI verification
│   │   │   ├── verify-kite/       # KiteAI x402 verification
│   │   │   ├── verify-base/       # Base Verify (anti-sybil)
│   │   │   ├── hedera/attest/     # Hedera HCS attestation
│   │   │   ├── reviews/           # Review CRUD
│   │   │   └── projects/          # Project management
│   │   ├── page.tsx               # Landing (category tabs + leaderboard)
│   │   └── review/                # Review submission page
│   ├── lib/
│   │   ├── hedera.ts              # Hedera SDK integration
│   │   ├── 0g-compute.ts          # 0G Compute broker
│   │   ├── trust-score.ts         # Trust score algorithm
│   │   └── telegram-alert.ts      # Telegram notifications
│   └── components/
│       ├── CategoryTabs.tsx        # All/AI Agents/DeFi/Coffee
│       ├── BaseVerifyButton.tsx    # Base Verify human check
│       └── SearchBar.tsx           # Project search
├── contracts/
│   ├── src/
│   │   ├── TrustGateHook.sol      # Uniswap V4 trust-gated hook (beforeSwap + dynamic fee)
│   │   └── TrustScoreOracle.sol   # On-chain trust oracle (token scores + user reputation)
│   ├── test/
│   │   ├── TrustGateHook.t.sol    # 29 tests (unit + fuzz)
│   │   └── TrustScoreOracle.t.sol # 22 tests (unit + fuzz)
│   └── script/
│       ├── Deploy.s.sol           # Deploy oracle + hook to Base Sepolia
│       └── Interact.s.sol         # Seed scores, update reputation, read state
├── prisma/schema.prisma           # Database schema
└── scripts/
    └── setup-hedera-topic.ts      # One-time HCS topic creation
```

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/JhiNResH/maiat.git
cd maiat

# Install
npm install

# Environment
cp .env.example .env
# Add: DATABASE_URL, PRIVATE_KEY, HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, HEDERA_TOPIC_ID

# Database
npx prisma generate
npx prisma db push

# Seed demo data
npx tsx scripts/seed-coffee.ts

# Run
npm run dev
```

---

## 🔌 API Reference

### Trust Score Query
```bash
GET /api/trust-score?project=huckleberry-roasters
```
```json
{
  "project": "Huckleberry Roasters",
  "trustScore": 85,
  "reviewCount": 5,
  "avgRating": 4.7,
  "verifiedReviews": 3
}
```

### Agent Trust Query (for AI agents)
```bash
GET /api/trust-score?token=0x1234...&agent=true
```

### User Reputation & Fee Tier
```bash
GET /api/reputation?address=0x872989...
```
```json
{
  "address": "0x872989...",
  "scarabPoints": 150,
  "totalReviews": 8,
  "reputationScore": 65,
  "trustLevel": "verified",
  "feeTier": 0.1,
  "feeDiscount": "80% off (0.1% fee)"
}
```

### Hedera Attestation
```bash
POST /api/hedera/attest
{ "reviewId": "clx..." }
```

---

## 🌐 Live Links

- **Web App:** [maiat.vercel.app](https://maiat.vercel.app)
- **Telegram Bot:** [@MaiatBot](https://t.me/MaiatBot)
- **Hedera Topic:** [0.0.7987770](https://hashscan.io/testnet/topic/0.0.7987770)
- **GitHub:** [github.com/JhiNResH/maiat](https://github.com/JhiNResH/maiat)
- **Twitter:** [@0xmaiat](https://x.com/0xmaiat)

---

## 👥 Team

**JhiNResH** — Builder  
Blockchain developer with hackathon wins across Solana and EVM ecosystems.

---

## 📄 License

MIT
