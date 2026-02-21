import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getSimpleTrustScore } from '@/lib/trust-score'
import { getMarketData, formatNumber, formatPrice } from '@/lib/market-data'
import { VoteButtons } from '@/components/VoteButtons'
import { OnChainBadge } from '@/components/OnChainBadge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Generate AI summary via Gemini
async function getAISummary(projectName: string, reviews: any[], category?: string, description?: string, website?: string, address?: string): Promise<string> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} } as any],
    })

    const type = category === 'm/ai-agents' ? 'AI agent' : category === 'm/defi' ? 'DeFi protocol' : 'business'
    const context = [
      `Project: ${projectName} (${type})`,
      description ? `Description: ${description}` : '',
      website ? `Website: ${website}` : '',
      address ? `Contract: ${address}` : '',
    ].filter(Boolean).join('\n')

    const baseInstructions = `You are a crypto analyst. Be concise. Use this EXACT format (no markdown headers, no bullet lists):

SUMMARY: [1-2 sentences max]
FUNDING: [amount raised, investors — or "No public data"]
STRENGTHS: [2-3 short points separated by " | "]
RISKS: [2-3 short points separated by " | "]

Keep total response under 200 words. No intro, no disclaimers.`

    let prompt: string
    if (reviews.length === 0) {
      prompt = `${baseInstructions}\n\nResearch "${projectName}".\n\n${context}`
    } else {
      const reviewTexts = reviews.slice(0, 5).map(r => `${r.rating}/5: "${r.content.slice(0, 100)}"`).join('\n')
      prompt = `${baseInstructions}\n\nResearch "${projectName}" considering these reviews:\n${reviewTexts}\n\n${context}`
    }

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (e) {
    return 'AI analysis temporarily unavailable.'
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>
}) {
  const { category, id } = await params
  const project = await prisma.project.findFirst({
    where: { OR: [{ slug: id }, { id }] },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { displayName: true, address: true, reputationScore: true } },
        },
      },
    },
  })

  if (!project) return notFound()

  const trustScore = getSimpleTrustScore(project.name, project.category, project.avgRating, project.reviewCount)
  const scoreColor = trustScore >= 80 ? 'text-green-600' : trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
  const barColor = trustScore >= 80 ? 'bg-green-500' : trustScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const riskLevel = trustScore >= 80 ? 'Low' : trustScore >= 50 ? 'Medium' : 'High'
  const categoryLabel = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : 'Coffee'
  const categorySlug = project.category.replace('m/', '')

  // Rating distribution
  const dist = [0, 0, 0, 0, 0]
  project.reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++
  })
  const maxDist = Math.max(...dist, 1)

  // Rating trend (last 10 reviews, oldest to newest)
  const trendReviews = [...project.reviews].reverse().slice(-10)
  const trendPoints = trendReviews.map((r, i) => {
    const x = (i / Math.max(trendReviews.length - 1, 1)) * 100
    const y = 100 - (r.rating / 5) * 100
    return `${x},${y}`
  }).join(' ')

  // Fetch AI summary + market data in parallel
  const [aiSummary, marketData] = await Promise.all([
    getAISummary(project.name, project.reviews, project.category, project.description || '', project.website || '', project.address),
    getMarketData(project.name, project.address, project.category),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-70">
          <img src="/logo-light.png" alt="MAIAT" className="w-8 h-8 block dark:hidden" /><img src="/logo-light.png" alt="MAIAT" className="w-8 h-8 hidden dark:block" />
          <span className="text-xl font-bold tracking-tight font-mono text-gray-900">MAIAT</span>
        </Link>
        <div className="flex-1" />
        <Link href="/?view=swap" className="text-xs font-mono px-2.5 py-1 rounded-md text-blue-600 hover:bg-blue-50">Swap</Link>
        <a href="https://t.me/MaiatBot" className="text-xs font-mono text-blue-600 hover:underline hidden sm:inline">@MaiatBot</a>
      </header>

      <main className="px-3 sm:px-6 py-4 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-3 text-xs font-mono text-gray-400">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span className="mx-1">/</span>
          <Link href={`/?cat=${categorySlug}`} className="hover:text-gray-600">{categoryLabel}</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">{project.name}</span>
        </div>

        {/* Project Header Card */}
        <div className="bg-white border border-gray-200 rounded-md p-5 mb-4">
          <div className="flex items-start gap-4">
            {project.image ? (
              <img src={project.image} alt={project.name} className="w-14 h-14 rounded-lg border border-gray-200" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold font-mono text-gray-400 border border-gray-200">
                {project.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold font-mono text-gray-900">{project.name}</h1>
                <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500">{categoryLabel}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${trustScore >= 80 ? 'bg-green-50 text-green-700 border border-green-200' : trustScore >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  Risk: {riskLevel}
                </span>
              </div>

              {project.description && (
                <p className="text-sm font-mono text-gray-500 mb-3">{project.description}</p>
              )}

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-6 rounded-full ${barColor}`} />
                  <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{trustScore}</span>
                  <span className="text-xs font-mono text-gray-400">/100</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono text-gray-600">{'⭐'.repeat(Math.round(project.avgRating))}</span>
                  <span className="text-sm font-bold font-mono text-gray-900">{project.avgRating.toFixed(1)}</span>
                  <span className="text-xs font-mono text-gray-400">({project.reviewCount} reviews)</span>
                </div>

                {project.website && (
                  <a href={project.website} target="_blank" rel="noopener" className="text-xs font-mono text-blue-600 hover:underline">🔗 Website</a>
                )}

                <VoteButtons projectId={project.id} projectName={project.name} />
              </div>
            </div>
          </div>
        </div>

        {/* Market Data */}
        <div className="bg-white border border-gray-200 rounded-md mb-4">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono">📊 Market Data</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            <div className="p-3 text-center">
              <div className="text-xs font-mono text-gray-400 mb-1">Price</div>
              <div className="text-sm font-bold font-mono text-gray-900">
                {formatPrice(marketData.price)}
                {marketData.priceChange24h ? (
                  <span className={`ml-1 text-xs ${marketData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(1)}%
                  </span>
                ) : null}
              </div>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs font-mono text-gray-400 mb-1">Market Cap</div>
              <div className="text-sm font-bold font-mono text-gray-900">{formatNumber(marketData.marketCap || marketData.fdv)}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs font-mono text-gray-400 mb-1">{marketData.tvl ? 'TVL' : 'Liquidity'}</div>
              <div className="text-sm font-bold font-mono text-gray-900">{formatNumber(marketData.tvl || marketData.liquidity)}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs font-mono text-gray-400 mb-1">24h Volume</div>
              <div className="text-sm font-bold font-mono text-gray-900">{formatNumber(marketData.volume24h)}</div>
            </div>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1">
              {marketData.audited ? <><span className="text-green-600">✅</span> Audited</> : <><span className="text-yellow-600">⚠️</span> Not audited</>}
            </span>
            {marketData.dexUrl && (
              <a href={marketData.dexUrl} target="_blank" rel="noopener" className="text-blue-600 hover:underline">DEXScreener ↗</a>
            )}
            <span className="ml-auto text-gray-400">Data: DEXScreener · DeFiLlama · CoinGecko</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-white border border-gray-200 rounded-md mb-4 p-4">
          <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono mb-2 flex items-center gap-2">
            <span>🤖 AI Analysis</span>
            <span className="text-xs font-normal text-gray-400">(Powered by Gemini)</span>
          </h3>
          <div className="text-sm font-mono text-gray-700 leading-relaxed space-y-2">
            {aiSummary.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => {
              const [label, ...rest] = line.split(':')
              const value = rest.join(':').trim()
              if (['SUMMARY', 'FUNDING', 'STRENGTHS', 'RISKS'].includes(label.trim().toUpperCase())) {
                return (
                  <div key={i} className="flex gap-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      label.trim().toUpperCase() === 'RISKS' ? 'bg-red-50 text-red-600' :
                      label.trim().toUpperCase() === 'STRENGTHS' ? 'bg-green-50 text-green-600' :
                      label.trim().toUpperCase() === 'FUNDING' ? 'bg-blue-50 text-blue-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>{label.trim()}</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                )
              }
              return <p key={i} className="text-gray-600">{line}</p>
            })}
          </div>
        </div>

        {/* Rating Distribution + Trend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Distribution */}
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono mb-3">Rating Distribution</h3>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500 w-6">{rating}★</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${rating >= 4 ? 'bg-green-500' : rating === 3 ? 'bg-yellow-500' : 'bg-red-400'}`}
                      style={{ width: `${(dist[rating - 1] / maxDist) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-400 w-4 text-right">{dist[rating - 1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono mb-3">Rating Trend</h3>
            {trendReviews.length < 2 ? (
              <div className="h-20 flex items-center justify-center text-xs font-mono text-gray-400">Need more reviews for trend</div>
            ) : (
              <div className="relative h-20">
                <div className="absolute left-0 top-0 text-[10px] font-mono text-gray-400">5</div>
                <div className="absolute left-0 bottom-0 text-[10px] font-mono text-gray-400">1</div>
                <div className="absolute left-4 right-0 top-0 bottom-0">
                  {[0, 25, 50, 75, 100].map(y => (
                    <div key={y} className="absolute w-full border-t border-gray-100" style={{ top: `${y}%` }} />
                  ))}
                </div>
                <svg className="absolute left-4 right-0 top-0 bottom-0 w-[calc(100%-16px)] h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline points={trendPoints} fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  {trendReviews.map((r, i) => {
                    const x = (i / Math.max(trendReviews.length - 1, 1)) * 100
                    const y = 100 - (r.rating / 5) * 100
                    return <circle key={i} cx={x} cy={y} r="3" fill="#22c55e" vectorEffect="non-scaling-stroke" />
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Reviews + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Reviews List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-md">
              <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono">Reviews ({project.reviews.length})</h3>
              </div>

              {project.reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-mono text-sm">No reviews yet. Be the first!</div>
              ) : (
                <div>
                  {project.reviews.map((review, i) => {
                    const displayAddr = review.reviewer.address.startsWith('tg:')
                      ? review.reviewer.displayName || `tg:${review.reviewer.address.slice(3, 7)}...`
                      : review.reviewer.displayName || `${review.reviewer.address.slice(0, 6)}...${review.reviewer.address.slice(-4)}`
                    const date = new Date(review.createdAt).toLocaleDateString()

                    return (
                      <div key={review.id} className={`px-4 py-3 ${i < project.reviews.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold font-mono text-gray-900">{displayAddr}</span>
                            {review.reviewer.address.startsWith('tg:') ? (
                              <span className="text-xs font-mono px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded border border-sky-200">📱 Telegram</span>
                            ) : (
                              <span className="text-xs font-mono px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200">🛡️ Verified Human</span>
                            )}
                            {review.reviewer.reputationScore && review.reviewer.reputationScore > 0 && (
                              <span className="text-xs font-mono px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-200">Rep: {review.reviewer.reputationScore}</span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-gray-400">{date}</span>
                        </div>

                        <div className="flex items-center gap-0.5 mb-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>

                        <p className="text-sm text-gray-700 font-mono leading-relaxed">{review.content}</p>

                        <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-400">
                          <span>👍 {review.upvotes}</span>
                          <span>👎 {review.downvotes}</span>
                          <span className="ml-auto">
                            <OnChainBadge reviewId={review.id} txHash={(review as any).txHash} />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-white border border-gray-200 rounded-md p-5 text-center">
                <h3 className="text-sm font-bold font-mono text-gray-900 mb-2">Review {project.name}</h3>
                <p className="text-xs font-mono text-gray-500 mb-4">Write verified reviews through our Telegram bot. AI-checked + on-chain verified.</p>
                <a
                  href={`https://t.me/MaiatBot?start=review_${(project as any).slug || project.id}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold font-mono text-sm py-2.5 px-6 rounded-md transition-colors"
                >
                  ✍️ Review on Telegram
                </a>
              </div>

              <div className="mt-4 bg-white border border-gray-200 rounded-md p-4">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono mb-2">Details</h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-xs font-mono text-gray-400">Contract:</span>
                    <span className="text-xs font-mono text-blue-600">{project.address.length > 20 ? `${project.address.slice(0, 10)}...${project.address.slice(-6)}` : project.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-mono text-gray-400">Chain:</span>
                    <span className="text-xs font-mono text-gray-900">{project.category === 'm/ai-agents' ? 'Base (Virtuals)' : 'Ethereum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-mono text-gray-400">Status:</span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">Active</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-white border border-gray-200 rounded-md p-4">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono mb-2">About Maiat Trust</h3>
                <ul className="space-y-1.5 text-xs font-mono text-gray-500">
                  <li>🪲 Reviews cost 2 Scarab — skin in the game</li>
                  <li>🤖 AI checks review quality</li>
                  <li>📊 Reputation grows with accurate reviews</li>
                  <li>⛓️ Verified on-chain</li>
                </ul>
              </div>

              <div className="mt-4 bg-white border border-gray-200 rounded-md p-4">
                <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono mb-2">API Access</h3>
                <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1.5 rounded block border border-gray-100">
                  GET /api/trust-score?project={project.name}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs font-mono text-gray-400 py-4">
          Maiat — Verified review layer for agentic commerce ·
          <a href="https://t.me/MaiatBot" className="text-blue-600 hover:underline ml-1">@MaiatBot</a> ·
          <a href="https://x.com/0xmaiat" target="_blank" rel="noopener" className="text-blue-600 hover:underline ml-1">@0xmaiat</a>
        </div>
      </main>
    </div>
  )
}
