# 🪲 Maiat × Chainlink CRE — Trust Score Oracle

> **AI-verified review trust scores, written on-chain via Chainlink CRE workflows.**

## 🎯 Track: CRE & AI ($17,000)

This project integrates Chainlink Runtime Environment (CRE) with Maiat's trust layer to create a decentralized, AI-powered review verification oracle.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 Chainlink CRE Workflow                     │
│                                                            │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Cron       │───▶│ HTTP Fetch   │───▶│ AI Verify    │  │
│  │ Trigger    │    │ Maiat API    │    │ Gemini AI    │  │
│  │ (5 min)    │    │ /reviews/    │    │ /verify-     │  │
│  │            │    │  pending     │    │  review      │  │
│  └────────────┘    └──────────────┘    └──────┬───────┘  │
│                                                │          │
│                    ┌───────────────────────────▼───────┐  │
│                    │  Consensus (BFT)                  │  │
│                    │  Median aggregation of scores     │  │
│                    └───────────────────┬───────────────┘  │
│                                        │                  │
│                    ┌───────────────────▼───────────────┐  │
│                    │  Write On-Chain                    │  │
│                    │  MaiatTrustConsumer.sol            │  │
│                    │  (Sepolia / BSC)                   │  │
│                    └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## 🔑 How It Works

1. **Cron Trigger**: Every 5 minutes, the CRE workflow activates
2. **Fetch Reviews**: Each DON node independently fetches pending reviews from `maiat.vercel.app/api/reviews/pending`
3. **AI Verification**: Reviews are sent to `maiat.vercel.app/api/verify-review` where Gemini AI analyzes them for:
   - Spam/bot detection
   - Content quality scoring
   - Authenticity verification
   - Balanced perspective check
4. **Consensus**: DON nodes reach BFT consensus on the aggregate trust score via median aggregation
5. **On-Chain Write**: Verified trust scores are written to `MaiatTrustConsumer.sol` via signed CRE report

## 📁 Files Using Chainlink

| File | Description |
|------|-------------|
| [`trust-score-workflow/main.ts`](./maiat-trust-oracle/trust-score-workflow/main.ts) | **Core CRE workflow** — Cron trigger, HTTP fetch, AI verify, chain write |
| [`trust-score-workflow/contracts/MaiatTrustConsumer.sol`](./maiat-trust-oracle/trust-score-workflow/contracts/MaiatTrustConsumer.sol) | **On-chain consumer** — Receives CRE reports, stores trust scores |
| [`trust-score-workflow/workflow.yaml`](./maiat-trust-oracle/trust-score-workflow/workflow.yaml) | Workflow configuration |
| [`trust-score-workflow/config.staging.json`](./maiat-trust-oracle/trust-score-workflow/config.staging.json) | Staging config (API URLs, chain config) |

## 🚀 Quick Start

### Prerequisites
- [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation/macos-linux) v1.0.11+
- [Bun](https://bun.com) v1.2.21+
- Funded Sepolia account

### Setup

```bash
cd maiat-trust-oracle

# Add your private key
echo 'CRE_ETH_PRIVATE_KEY=your_key_here' > .env

# Install dependencies
cd trust-score-workflow
bun install
cd ..

# Login to CRE
cre login

# Simulate the workflow
cre workflow simulate trust-score-workflow --target staging-settings
```

### Deploy

```bash
# Deploy consumer contract (Sepolia)
# Update config.staging.json with deployed address

# Deploy CRE workflow
cre workflow deploy trust-score-workflow --target production-settings
```

## 🔗 Integration with Maiat

This CRE workflow connects to two Maiat API endpoints:

### `GET /api/reviews/pending`
Returns reviews awaiting CRE verification:
```json
{
  "reviews": [
    {
      "id": "abc123",
      "projectId": "project_1",
      "content": "Great DeFi protocol with solid audit...",
      "rating": 4,
      "authorAddress": "0x..."
    }
  ],
  "count": 5
}
```

### `POST /api/verify-review`
AI-powered batch verification:
```json
// Request
{ "reviews": [{ "id": "abc123", "content": "...", "rating": 4, "projectId": "..." }] }

// Response
{
  "averageTrustScore": 78,
  "verifications": [
    { "reviewId": "abc123", "trustScore": 85, "isLegitimate": true, "confidence": 92, "reason": "Detailed technical review" }
  ]
}
```

## 📊 CRE Capabilities Used

| Capability | Usage |
|-----------|-------|
| **CronCapability** | Triggers workflow every 5 minutes |
| **HTTPClient** | Fetches reviews + calls AI verification API |
| **EVMClient** | Writes trust scores to on-chain consumer contract |
| **runInNodeMode** | Ensures each DON node fetches independently |
| **consensusMedianAggregation** | BFT consensus on trust scores |
| **runtime.report()** | Generates signed report for on-chain write |

## 🏆 Why This Matters

Traditional review systems are centralized and easily gamed. Maiat + Chainlink CRE creates:

- **Decentralized verification**: Multiple DON nodes independently verify reviews
- **AI-powered quality scoring**: Gemini AI detects spam, fakes, and low-quality reviews
- **On-chain trust scores**: Immutable, queryable by smart contracts and AI agents
- **Consensus-backed**: BFT consensus ensures no single point of failure

This enables **AI agents to trustlessly query on-chain trust scores** before making transaction decisions — the core use case for the CRE & AI track.

---

*Built for [Chainlink Convergence Hackathon](https://chain.link/hackathon) — CRE & AI Track*
*Part of [Maiat](https://maiat.vercel.app) — The Trust Layer for Agentic Commerce*
