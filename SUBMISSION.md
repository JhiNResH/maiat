# 🪲 Maiat — DoraHacks BNB Good Vibes Submission

> **Copy-paste ready for DoraHacks. JhiNResH: review, tweak, submit.**

---

## Project Name
Maiat

## One-liner
The trust score layer for agentic commerce — verified reviews + AI scoring for AI agents and DeFi protocols.

## Problem
AI agents will soon handle billions in transactions, but they have no way to verify if another agent or protocol is trustworthy. There's no "Yelp for crypto" — no reputation system that agents can programmatically query before transacting. Result: agents get rugged, users lose funds, and the agentic economy can't scale without trust.

## Solution
Maiat is the first trust and reputation layer built for AI agents operating in Web3:

1. **Trust Score API** — Any agent can query `GET /api/trust-score?project=AIXBT` to get a 0-100 trust score before transacting. No API key needed.
2. **On-chain Review Anchoring** — Reviews are hashed and stored on BSC via our ReviewRegistry contract, making reputation tamper-proof.
3. **AI Verification** — Reviews are verified using 0G Compute's decentralized inference (Qwen 2.5 7B with TeeML) to detect fake/spam reviews.
4. **x402 Micropayments** — Agents pay per verification via Kite AI's x402 protocol (0.001 KITE per check), creating a sustainable business model.
5. **Scarab Economy** — Off-chain reputation points that reward quality reviewers and create a trust flywheel.
6. **Telegram Bot** — @MaiatBot allows users to submit reviews and query trust scores via chat, with Gemini 2.0 Flash AI analysis.

## On-Chain Proof (BSC Testnet)
- **ReviewRegistry Contract:** [0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37](https://testnet.bscscan.com/address/0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37)
- **Chain:** BSC Testnet (Chain ID: 97)
- **Functions:** `submitReview()`, `getReview()`, `getProjectReviews()`
- **Reviews are content-hashed (keccak256) and anchored on-chain**

## Tech Stack
- **Frontend:** Next.js 16 + TailwindCSS + Privy wallet auth
- **Backend:** Prisma + Supabase (PostgreSQL)
- **AI:** Gemini 2.0 Flash (analysis) + 0G Compute (decentralized verification)
- **Blockchain:** BSC Testnet (ReviewRegistry) + Kite AI (x402 payments) + Base (identity)
- **Bot:** Telegram Bot (Node.js) with Gemini-powered review analysis

## Architecture
```
Agent → GET /api/trust-score → Aggregated score from:
  ├── Human reviews (on-chain anchored on BSC)
  ├── AI verification (0G Compute)
  ├── x402 payment verification (Kite AI)
  └── Scarab reputation points
→ Agent decides: transact or avoid
→ Post-transaction: POST /api/reviews (feedback loop)
```

## What Makes Us Different
1. **Agent-first API** — Not a human UI with an API bolted on. Built for programmatic consumption.
2. **Multi-layer verification** — Human reviews + AI analysis + on-chain proof. Not just one signal.
3. **Sustainable model** — x402 micropayments per verification = revenue from day 1.
4. **BSC-native** — ReviewRegistry deployed on BSC, not bridged from another chain.

## Demo
- **Live Dashboard:** [maiat.xyz](https://maiat.xyz) (if Vercel deployed)
- **API Docs:** [maiat.xyz/docs](https://maiat.xyz/docs)
- **Telegram Bot:** [@MaiatBot](https://t.me/MaiatBot)
- **GitHub:** [github.com/JhiNResH/maiat](https://github.com/JhiNResH/maiat)

## Team
- **JhiNResH** — Blockchain developer, multiple hackathon winner, Solana ecosystem builder

## Links
- GitHub: https://github.com/JhiNResH/maiat
- BSC Contract: https://testnet.bscscan.com/address/0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37
- Telegram Bot: https://t.me/MaiatBot

---

## 📸 Screenshots Needed (JhiNResH TODO)
1. Dashboard homepage showing projects + trust scores
2. Project detail page with reviews
3. API docs page (`/docs`)
4. Telegram bot interaction
5. BscScan contract page

## 🎥 Demo Video Script (2 min)
1. (0:00-0:20) Hook: "AI agents handle billions, but how do they know who to trust?"
2. (0:20-0:50) Show dashboard — projects, trust scores, reviews
3. (0:50-1:10) Live API call: `curl /api/trust-score?project=AIXBT` → show JSON response
4. (1:10-1:30) Show BscScan — review anchored on-chain
5. (1:30-1:50) Telegram bot: submit review via @MaiatBot
6. (1:50-2:00) Close: "Maiat — trust before you transact. maiat.xyz"
