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
- **How:** Users prove humanity via Base Verify Mini App → "Verified Human" badge
- **Endpoint:** `POST /api/verify-base`
- **App ID:** `699600ef25337829d86a5475`
- **Chain:** Base Mainnet (8453)

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
│   ├── src/TrustGateHook.sol      # Uniswap V4 trust-gated hook
│   └── src/TrustScoreOracle.sol   # On-chain trust oracle
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
