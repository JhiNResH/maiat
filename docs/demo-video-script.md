# Maiat Demo Video Script (2-3 min)

## Opening (15s)
"Crypto has a trust problem. You're about to swap on a new DEX or delegate to an AI agent — but how do you know it's safe? There's no Yelp for crypto. Maiat fixes that."

## 1. Browse Projects (20s)
- Open maiat.vercel.app
- Show categories: DeFi protocols + AI agents
- "We track trust scores for both DeFi and AI agents across Ethereum, Base, and BNB Chain"

## 2. Trust Score (20s)
- Click on Uniswap
- Show trust score: 90, Low Risk
- "Each score combines AI analysis with verified community reviews. More reviews = more community weight."
- Show score breakdown

## 3. Write a Review — Usage Proof (30s)
- Click "Write Review"
- Paste a real tx hash
- "Here's the key — you can't review unless you've actually used the protocol. We verify your transaction on-chain."
- Show verification success
- Write review + submit
- "No staking required. Just proof you're a real user."

## 4. Agent Commerce — ACP (30s)
- Switch to terminal
- `npx acp sell list` → show trust_score_query + deep_insight_report
- "AI agents can also query our trust scores. Through Virtuals' Agent Commerce Protocol, any agent pays 0.01 USDC to check if a protocol is safe before trading."
- Show ACP agent page (app.virtuals.io)
- `curl https://maiat.vercel.app/api/trust-score?project=aave` → show JSON response

## 5. Real-time Alerts (15s)
- Show Telegram @maiatalerts channel
- "When a project needs more reviews, we alert the community in real-time."

## 6. Auto-discovery (15s)
- Query a project not in DB: `?project=solana`
- "Any crypto project is queryable. If we don't have it, we auto-create from CoinGecko."

## Closing (15s)
"Human signals, Agent decisions. One trust layer for all of crypto. Maiat — verify before you trust."

---

**Total: ~2.5 minutes**

**Tips:**
- Record screen with Loom or QuickTime
- Use split screen: browser left, terminal right for ACP section
- Keep energy up, move fast between sections
- Have tx hash ready before recording
