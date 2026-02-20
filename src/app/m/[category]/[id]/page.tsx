import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getSimpleTrustScore } from '@/lib/trust-score'
import { VoteButtons } from '@/components/VoteButtons'
import { OnChainBadge } from '@/components/OnChainBadge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
  const riskColor = trustScore >= 80 ? 'text-green-600' : trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
  const categoryLabel = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : 'Coffee'
  const categorySlug = project.category.replace('m/', '')

  // Rating distribution
  const dist = [0, 0, 0, 0, 0]
  project.reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++
  })
  const maxDist = Math.max(...dist, 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-70">
          <img src="/maiat-rmbg.png" alt="MAIAT" className="w-8 h-8" />
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
            {/* Logo */}
            {project.image ? (
              <img src={project.image} alt={project.name} className="w-14 h-14 rounded-lg border border-gray-200" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold font-mono text-gray-400 border border-gray-200">
                {project.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            {/* Info */}
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
                {/* Trust Score */}
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-6 rounded-full ${barColor}`} />
                  <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{trustScore}</span>
                  <span className="text-xs font-mono text-gray-400">/100</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono text-gray-600">{'⭐'.repeat(Math.round(project.avgRating))}</span>
                  <span className="text-sm font-bold font-mono text-gray-900">{project.avgRating.toFixed(1)}</span>
                  <span className="text-xs font-mono text-gray-400">({project.reviewCount} reviews)</span>
                </div>

                {/* Links */}
                {project.website && (
                  <a href={project.website} target="_blank" rel="noopener" className="text-xs font-mono text-blue-600 hover:underline flex items-center gap-1">
                    🔗 Website
                  </a>
                )}

                <VoteButtons projectId={project.id} projectName={project.name} />
              </div>
            </div>
          </div>
        </div>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Rating Distribution */}
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

          {/* Project Details */}
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase font-mono mb-3">Details</h3>
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
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-400">Reviews:</span>
                <span className="text-xs font-mono text-gray-900">{project.reviewCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews + Write Review */}
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
              {/* Review via Telegram */}
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
