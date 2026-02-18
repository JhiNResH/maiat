import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) return { title: 'Not Found | Maiat' }
  const trustScore = Math.round(project.avgRating * 20)
  return {
    title: `${project.name} Trust Score & Reviews | Maiat`,
    description: `${project.name} has a trust score of ${trustScore}/100 based on ${project.reviewCount} verified reviews on Maiat.`,
  }
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { displayName: true, address: true } },
        },
      },
    },
  })

  if (!project) notFound()

  const trustScore = Math.round(project.avgRating * 20)
  const scoreColor = trustScore >= 80 ? 'text-green-600' : trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
  const barColor = trustScore >= 80 ? 'bg-green-500' : trustScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  const riskLevel = trustScore >= 80 ? 'Low' : trustScore >= 50 ? 'Medium' : 'High'
  const riskColor = trustScore >= 80 ? 'text-green-600 bg-green-50' : trustScore >= 50 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
  const categoryLabel = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : project.category
  const totalUpvotes = project.reviews.reduce((sum, r) => sum + r.upvotes, 0)
  const totalDownvotes = project.reviews.reduce((sum, r) => sum + r.downvotes, 0)

  // Rating distribution
  const dist = [0, 0, 0, 0, 0]
  project.reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++ })
  const maxDist = Math.max(...dist, 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight font-mono hover:opacity-70">MAIAT</Link>
        <div className="flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-gray-500 bg-gray-50"
          />
        </div>
        <a href="https://t.me/MaiatBot" className="text-xs font-mono text-blue-600 hover:underline">@MaiatBot</a>
      </header>

      <main className="px-6 py-4 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-3 text-xs font-mono text-gray-400">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">{project.name}</span>
        </div>

        {/* Title Row */}
        <div className="flex items-center gap-3 mb-4">
          {project.image ? (
            <img src={project.image} alt={project.name} className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs font-bold font-mono text-gray-500">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold font-mono text-gray-900">{project.name}</h1>
          <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500">{categoryLabel}</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${riskColor}`}>Risk: {riskLevel}</span>
        </div>

        {/* Overview Grid — Etherscan style */}
        <div className="bg-white border border-gray-200 rounded-md mb-4">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            {/* Left */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-500">Trust Score:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-5 rounded-full ${barColor}`} />
                  <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{trustScore}</span>
                  <span className="text-xs font-mono text-gray-400">/ 100</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-500">Avg Rating:</span>
                <span className="text-sm font-mono text-gray-900">{'⭐'.repeat(Math.round(project.avgRating))} {project.avgRating.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-500">Total Reviews:</span>
                <span className="text-sm font-mono text-gray-900">{project.reviewCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-500">Sentiment:</span>
                <span className="text-sm font-mono text-gray-900">👍 {totalUpvotes} / 👎 {totalDownvotes}</span>
              </div>
            </div>
            {/* Right */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-500">Contract:</span>
                <span className="text-xs font-mono text-blue-600">{project.address.slice(0, 10)}...{project.address.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-500">Category:</span>
                <span className="text-sm font-mono text-gray-900">{categoryLabel}</span>
              </div>
              {project.website && (
                <div className="flex justify-between">
                  <span className="text-xs font-mono text-gray-500">Website:</span>
                  <a href={project.website} target="_blank" className="text-xs font-mono text-blue-600 hover:underline">{project.website.replace('https://', '')}</a>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-500">Status:</span>
                <span className="text-xs font-mono px-2 py-0.5 bg-green-50 text-green-700 rounded">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-mono text-gray-500">First Review:</span>
                <span className="text-xs font-mono text-gray-900">
                  {project.reviews.length > 0 
                    ? new Date(project.reviews[project.reviews.length - 1].createdAt).toISOString().split('T')[0]
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white border border-gray-200 rounded-md mb-4 p-4">
          <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase font-mono mb-3">Rating Distribution</h3>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500 w-8">{star} ⭐</span>
                <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded"
                    style={{ width: `${(dist[star - 1] / maxDist) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-500 w-6 text-right">{dist[star - 1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white border border-gray-200 rounded-md">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase font-mono">
              Reviews ({project.reviews.length})
            </h3>
            <a href="https://t.me/MaiatBot" className="text-xs font-mono text-blue-600 hover:underline">+ Add Review via Telegram</a>
          </div>

          {project.reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-mono text-sm">
              No reviews yet. Be the first — message @MaiatBot on Telegram.
            </div>
          ) : (
            <div>
              {project.reviews.map((review, i) => {
                const displayAddr = review.reviewer.address.startsWith('tg:')
                  ? review.reviewer.displayName || `tg:${review.reviewer.address.slice(3, 7)}...`
                  : `${review.reviewer.address.slice(0, 6)}...${review.reviewer.address.slice(-4)}`
                const date = new Date(review.createdAt).toISOString().split('T')[0]
                const ratingColor = review.rating >= 4 ? 'text-green-600' : review.rating >= 3 ? 'text-yellow-600' : 'text-red-600'

                return (
                  <div key={review.id} className={`px-4 py-3 ${i < project.reviews.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold font-mono text-gray-900">{displayAddr}</span>
                        <span className={`text-xs font-mono ${ratingColor}`}>Rating: {review.rating}.0</span>
                        {review.txHash && (
                          <span className="text-xs font-mono px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">On-chain ✓</span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-gray-400">{date}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-mono leading-relaxed">{review.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* API Info */}
        <div className="bg-white border border-gray-200 rounded-md mt-4 p-4">
          <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase font-mono mb-2">API Access</h3>
          <code className="text-xs font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded block">
            GET /api/trust-score?project={project.name}
          </code>
          <p className="text-xs font-mono text-gray-400 mt-2">Public endpoint for AI agents. No authentication required.</p>
        </div>
      </main>
    </div>
  )
}
