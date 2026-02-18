import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { TrustBadge } from '@/components/TrustBadge'
import { ReviewForm } from '@/components/ReviewForm'
import { VoteButtons } from '@/components/VoteButtons'
import { OnChainBadge } from '@/components/OnChainBadge'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Star, ThumbsUp, ThumbsDown, Clock, Shield } from 'lucide-react'

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

  const stars = Math.round(project.avgRating)
  const categorySlug = project.category.replace('m/', '')

  // Rating distribution
  const dist = [0, 0, 0, 0, 0]
  project.reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++
  })
  const maxDist = Math.max(...dist, 1)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/m/${categorySlug}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-purple-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to m/{categorySlug}
        </Link>

        {/* Project Header */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-700">
              {project.image ? (
                <img src={project.image} alt={project.name} className="w-14 h-14 object-contain" />
              ) : (
                <span className="text-4xl">🧩</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <TrustBadge
                  status={project.status as 'approved' | 'pending' | 'rejected'}
                  size="md"
                />
              </div>

              {project.description && (
                <p className="text-zinc-400 mb-4 max-w-2xl">{project.description}</p>
              )}

              <div className="flex items-center gap-6 flex-wrap">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          s <= stars ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">{project.avgRating.toFixed(1)}</span>
                  <span className="text-sm text-zinc-500">({project.reviewCount} reviews)</span>
                </div>

                {/* Links */}
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                )}

                {/* Vote */}
                <VoteButtons
                  projectId={project.id}
                  projectName={project.name}
                />
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          {project.reviews.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Rating Distribution</h3>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-zinc-500 text-right">{rating}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400/60 rounded-full transition-all"
                        style={{ width: `${(dist[rating - 1] / maxDist) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-zinc-600 text-right">{dist[rating - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reviews List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">
              Reviews ({project.reviews.length})
            </h2>

            {project.reviews.length === 0 ? (
              <div className="border border-zinc-800 rounded-xl p-8 text-center">
                <p className="text-zinc-500">No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {project.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                  >
                    {/* Review Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
                          {(review.reviewer.displayName || review.reviewer.address)[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {review.reviewer.displayName || `${review.reviewer.address.slice(0, 6)}...${review.reviewer.address.slice(-4)}`}
                          </span>
                          {review.reviewer.reputationScore > 0 && (
                            <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                              Rep: {review.reviewer.reputationScore}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-600">
                        <Clock className="w-3 h-3" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-zinc-300 text-sm leading-relaxed">{review.content}</p>

                    {/* Review Votes + On-Chain Status */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {review.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" /> {review.downvotes}
                      </span>
                      <span className="ml-auto">
                        <OnChainBadge
                          reviewId={review.id}
                          txHash={(review as any).txHash}
                        />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Write Review */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ReviewForm projectId={project.id} projectName={project.name} />

              {/* Trust Info */}
              <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-sm">About Maiat Trust</h3>
                </div>
                <ul className="space-y-2 text-xs text-zinc-500">
                  <li>🪲 Reviews cost 2 Scarab — skin in the game</li>
                  <li>🤖 Gemini AI checks review quality</li>
                  <li>📊 Your reputation grows with accurate reviews</li>
                  <li>⛓️ On-chain verification on BSC</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
