# Maiat — ETHDenver BUIDLathon Submission

## One-liner
Crypto's trust layer — verified reviews powered by on-chain usage proof and AI agent commerce.

## Description (300 words)

Maiat is the trust infrastructure for crypto. Before you swap, stake, or delegate to an AI agent — check what real users think.

**The problem:** Crypto has no Yelp. Users blindly ape into protocols and AI agents with zero social proof. Fake reviews plague Web2 platforms. In Web3, we can do better.

**The solution:** Maiat requires on-chain usage proof before you can review. If you haven't used the protocol, you can't review it. No staking, no token gating — just proof you're a real user.

**How it works:**
1. Use a DeFi protocol or AI agent (Ethereum, Base, BSC)
2. Submit your transaction hash as usage proof
3. Maiat verifies on-chain that you actually interacted with the contract
4. Write your review — it's weighted by your verified usage history
5. Trust scores update in real-time, available to humans AND AI agents

**Agent Commerce (Virtuals ACP):**
AI agents can programmatically query Maiat's trust scores before making decisions. An AI trading agent can check "is this protocol safe?" before executing a swap — paying 0.01 USDC per query through Virtuals' Agent Commerce Protocol.

**Tech stack:**
- Next.js + Supabase + Prisma (web app)
- On-chain verification: Ethereum, Base, BSC (Etherscan/BaseScan/BscScan APIs)
- Virtuals ACP: Seller agent on Base mainnet (Railway deployed, 24/7)
- BSC ReviewRegistry: On-chain review anchoring
- Telegram alerts: Real-time notifications for review-needed projects
- Auto-discovery: CoinGecko integration for any crypto project

**Why it matters:**
- Human signals, Agent decisions — one trust system for both
- Sybil-resistant reviews (usage proof > token gating)
- Open API — any agent or app can query trust scores

## Category
DeFi / AI Agents / Infrastructure

## Bounties
- **Virtuals Protocol** — ACP seller agent (trust score + deep insight offerings)
- **Base** — Built on Base, usage proof verification on Base chain
- **BNB Chain** — BSC ReviewRegistry contract + BscScan verification
- **0G Network** — AI verification via decentralized compute (TeeML)
- **KiteAI** — On-chain knowledge verification

## Links
- **Live:** https://maiat.vercel.app
- **GitHub:** https://github.com/JhiNResH/maiat
- **ACP Agent:** https://app.virtuals.io/acp/agent-details/3723
- **Trust Score API:** https://maiat.vercel.app/api/trust-score?project=uniswap
- **Telegram Alerts:** @maiatalerts

## Team
- JhiNResH — Solo builder. Solana ecosystem background, multiple hackathon wins.

## Demo Flow (for video)
1. Open maiat.vercel.app → browse projects (DeFi + AI agents)
2. Click Uniswap → show trust score breakdown (AI baseline + community)
3. Submit a review with tx hash → usage proof verified on-chain
4. Show trust score update
5. Terminal: `npx acp sell list` → show offerings registered
6. Terminal: `curl https://maiat.vercel.app/api/trust-score?project=uniswap` → API response
7. Show Telegram @maiatalerts → real-time notification
8. Show ACP agent page: app.virtuals.io/acp/agent-details/3723
