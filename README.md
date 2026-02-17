# 🪲 Maiat — Trust Layer for Agentic Commerce

> **Building the reputation oracle that AI agents need to transact safely in a decentralized world.**

Maiat is the **first trust and reputation layer** purpose-built for AI agents operating in Web3. As autonomous agents increasingly handle payments, reviews, and asset management, they need a way to verify trustworthiness without human oversight. Maiat provides on-chain reputation proofs, AI-powered verification, and micropayment-based trust scores for agents to interact confidently in the agentic economy.

---

## 🎯 Problem Statement

AI agents will soon handle billions of dollars in transactions, but they lack:
- **Trust infrastructure**: No way to verify if another agent is malicious
- **Reputation layer**: Can't distinguish between reliable and scam agents
- **Payment verification**: No protocol for agents to pay for trust verification at scale
- **Autonomous governance**: Need human-free trust verification

Maiat solves this with:
1. **AI-powered review analysis** (Gemini 2.0 Flash)
2. **On-chain verification** (0G Compute + BSC)
3. **x402 micropayments** (Kite AI testnet)
4. **Decentralized reputation oracle** (Scarab points system)

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** (App Router + Turbopack)
- **TailwindCSS** (Custom dark theme)
- **Privy** (Wallet auth)
- **Zustand** (State management)

### Backend
- **Prisma + SQLite** (Local database)
- **Next.js API Routes** (Serverless functions)
- **Gemini 2.0 Flash** (AI analysis)

### Blockchain & AI
- **0G Compute** - Decentralized AI inference ([verify-0g endpoint](src/app/api/verify-0g/route.ts))
- **Kite AI** - x402 payment protocol for agent verification ([verify-kite endpoint](src/app/api/verify-kite/route.ts))
- **BSC Testnet** - On-chain review anchoring
- **Privy** - Embedded wallet UX

### Key Integrations
1. **0G Compute Network**
   - AI inference verification
   - Decentralized model serving
   - Request ID: `maiat-review-{timestamp}`
   
2. **Kite AI x402 Protocol**
   - RPC: `https://rpc-testnet.gokite.ai/`
   - Chain ID: `2368`
   - Faucet: `https://faucet.gokite.ai`
   - Agent-pays-per-verification model
   - HTTP 402 Payment Required flow

3. **Gemini 2.0 Flash**
   - Real-time AI agent & DeFi project analysis
   - Grounded search with Google integration
   - Scoring: 0-5 scale (VERIFIED/UNSTABLE/RISKY)

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+ 
- npm/pnpm
- SQLite

### Installation

```bash
# Clone the repo
git clone https://github.com/JhiNResH/maiat.git
cd maiat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Required env vars:
# GOOGLE_GENERATIVE_AI_API_KEY=<your-gemini-api-key>
# NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
# KITE_PAYMENT_ADDRESS=<your-kite-wallet> (optional)
# 0G_COMPUTE_API_KEY=<your-0g-key> (optional)

# Initialize database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Visit `http://localhost:3000`

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface (Next.js)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Search   │  │ Review   │  │ Profile  │  │ Category │   │
│  │ Modal    │  │ Submit   │  │ Page     │  │ Browser  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │           │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼───────────┐
│                   API Layer (Next.js Routes)                │
│  /api/search          /api/reviews        /api/projects     │
│  /api/verify-kite     /api/verify-0g      /api/scarab/*     │
└───────┬─────────────┬──────────────┬──────────┬─────────────┘
        │             │              │          │
┌───────▼─────┐  ┌────▼────┐  ┌──────▼──┐  ┌───▼────────┐
│ Gemini 2.0  │  │ Kite AI │  │ 0G Comp.│  │ Prisma DB  │
│ Flash       │  │ x402    │  │ Network │  │ (SQLite)   │
│ (AI Score)  │  │ Verify  │  │ (Verify)│  │            │
└─────────────┘  └─────────┘  └─────────┘  └────────────┘
        │             │              │
┌───────▼─────────────▼──────────────▼──────────────────────┐
│                  Blockchain Layer                          │
│  BSC Testnet (Review anchoring) + Kite Testnet (x402)     │
└────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Agent submits query** → SearchModal component
2. **AI analysis** → `analyzeProject()` via Gemini
3. **Project creation** → `findOrCreateProject()` → Prisma DB
4. **Review verification** → `/api/verify-kite` (x402 payment) or `/api/verify-0g` (AI compute)
5. **Reputation update** → Scarab points system
6. **On-chain proof** → BSC tx hash stored

---

## 🏆 Bounties Targeted

### 1️⃣ FUTURLLAMA
**Challenge**: Build with Llama 3.3 70B
- ✅ Gemini 2.0 Flash integration for AI project analysis
- ✅ Real-time scoring (0-5 scale: VERIFIED/UNSTABLE/RISKY)
- ✅ Grounded search with web context
- Location: [`src/app/actions/analyze.ts`](src/app/actions/analyze.ts)

### 2️⃣ 0G Labs
**Challenge**: Build with 0G Compute Network
- ✅ `/api/verify-0g` endpoint for decentralized AI verification
- ✅ Request ID tracking: `maiat-review-{timestamp}`
- ✅ Proof of compute integration
- Location: [`src/app/api/verify-0g/route.ts`](src/app/api/verify-0g/route.ts)

### 3️⃣ Kite AI
**Challenge**: Agent micropayments with x402 protocol
- ✅ `/api/verify-kite` endpoint
- ✅ HTTP 402 Payment Required flow
- ✅ Kite Testnet integration (Chain ID: 2368)
- ✅ Agent-pays-per-verification (0.001-0.1 KITE)
- ✅ Cryptographic payment proof validation
- Location: [`src/app/api/verify-kite/route.ts`](src/app/api/verify-kite/route.ts)

---

## 🎨 Key Features

### 🔍 AI-Powered Search
- **⌘K shortcut** for instant search
- **Tabs**: All / Projects / Reviews / Users
- **Categories**: AI Agents + DeFi only (hackathon focus)
- **AI Analysis**: One-click Gemini-powered project deep dive

### 🤖 Agent Verification
- **x402 Micropayments**: Agents pay per verification (Kite AI)
- **Confidence Scoring**: 0-100% trust level
- **Multi-tier**: Basic (0.001 KITE) / Premium (0.01) / Deep (0.1)
- **On-chain Proof**: Verification tx on Kite Testnet

### 🪲 Scarab Economy
- **Off-chain points** for review submissions
- **Daily claims** with streak bonuses
- **Boost system** for visibility
- **USDC purchase** (3 tiers: $1 / $5 / $20)

### 📊 Trust Metrics
- **Reputation Score**: Aggregated from reviews + upvotes
- **Project Status**: Approved / Pending / Flagged
- **Category Leaderboards**: Top AI Agents + DeFi protocols

---

## 🗂️ Database Schema

```prisma
// Core Models
model User {
  address         String   @unique
  reputationScore Int      @default(0)
  totalReviews    Int      @default(0)
  reviews         Review[]
  votes           Vote[]
}

model Project {
  address         String   @unique
  name            String
  category        String   // m/ai-agents | m/defi
  avgRating       Float    @default(0)
  reviewCount     Int      @default(0)
  status          String   // approved | pending | rejected
  reviews         Review[]
}

model Review {
  id              String   @id
  rating          Int      // 1-5
  content         String
  txHash          String?  // BSC tx hash
  contentHash     String?  // keccak256
  onChainReviewId String?  // ReviewRegistry ID
  reviewer        User
  project         Project
  votes           Vote[]
}

// Scarab Economy
model ScarabBalance {
  address         String   @unique
  balance         Int      @default(0)
  totalEarned     Int      @default(0)
  lastClaimAt     DateTime?
  streak          Int      @default(0)
}
```

Full schema: [`prisma/schema.prisma`](prisma/schema.prisma)

---

## 📁 Project Structure

```
maiat/
├── src/
│   ├── app/
│   │   ├── actions/          # Server actions
│   │   │   ├── analyze.ts    # Gemini AI analysis
│   │   │   └── createProject.ts
│   │   ├── api/
│   │   │   ├── search/       # Search endpoint
│   │   │   ├── verify-kite/  # Kite AI x402
│   │   │   ├── verify-0g/    # 0G Compute
│   │   │   ├── reviews/      # Review CRUD
│   │   │   ├── projects/     # Project CRUD
│   │   │   └── scarab/       # Points system
│   │   ├── m/[category]/     # Category pages
│   │   ├── users/[address]/  # Profile pages
│   │   └── page.tsx          # Homepage
│   ├── components/
│   │   ├── search/
│   │   │   └── SearchModal.tsx  # ⌘K search
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── ScarabWidget.tsx
│   └── lib/
│       ├── prisma.ts         # DB client
│       └── store.ts          # Zustand state
├── prisma/
│   └── schema.prisma         # Database schema
└── README.md                 # You are here!
```

---

## 🎯 Future Roadmap

- [ ] **Mainnet deployment** (0G Compute + Kite AI)
- [ ] **Agent SDK** for autonomous verification
- [ ] **Cross-chain support** (Ethereum, Arbitrum, Base)
- [ ] **Reputation NFTs** (soul-bound tokens)
- [ ] **DAO governance** for trust thresholds
- [ ] **Agent marketplace** (hire verified agents)
- [ ] **ZK proofs** for privacy-preserving reputation

---

## 🤝 Contributing

Maiat is open source! Contributions welcome:
1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a PR

---

## 📜 License

MIT License - see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

Built for **ETHDenver 2026** with:
- **0G Labs** - Decentralized AI compute
- **Kite AI** - Agent payment infrastructure
- **FUTURLLAMA** - AI model integration
- **Privy** - Wallet UX
- **BSC** - On-chain anchoring

---

## 📞 Contact

- **Team**: JhiNResH
- **Twitter**: [@JhiNResH](https://twitter.com/JhiNResH)
- **Demo**: [Coming soon]
- **Repo**: [github.com/JhiNResH/maiat](https://github.com/JhiNResH/maiat)

---

**🪲 Maiat — Where Trust Meets Autonomy**
