import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft, Trophy, Medal } from 'lucide-react'

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: categorySlug } = await params
  const cat = `m/${categorySlug}`

  const projects = await prisma.project.findMany({
    where: { category: cat },
    orderBy: [
      { avgRating: 'desc' },
      { reviewCount: 'desc' },
    ],
    take: 50,
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/m/${categorySlug}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to {categorySlug}</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-amber-400" />
            <h1 className="text-3xl font-bold">Top Skills</h1>
          </div>
          <p className="text-zinc-400">
            Community-ranked trust scores. Weighted by review count and quality.
          </p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {projects.map((p, index) => {
            const rank = index + 1
            const stars = '★'.repeat(Math.round(p.avgRating)) + '☆'.repeat(5 - Math.round(p.avgRating))

            return (
              <div
                key={p.id}
                className={`
                  flex items-center gap-4 bg-zinc-900/50 border rounded-xl p-4 transition-all
                  ${rank === 1 ? 'border-amber-400 shadow-lg shadow-amber-500/20' : ''}
                  ${rank === 2 ? 'border-zinc-400 shadow-lg shadow-zinc-500/20' : ''}
                  ${rank === 3 ? 'border-orange-600 shadow-lg shadow-orange-600/20' : ''}
                  ${rank > 3 ? 'border-zinc-700/50 hover:border-purple-500/40' : ''}
                `}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 text-center">
                  {rank === 1 && <Trophy className="w-8 h-8 text-amber-400 mx-auto" />}
                  {rank === 2 && <Medal className="w-8 h-8 text-zinc-400 mx-auto" />}
                  {rank === 3 && <Medal className="w-8 h-8 text-orange-600 mx-auto" />}
                  {rank > 3 && (
                    <div className="text-2xl font-bold text-zinc-600">#{rank}</div>
                  )}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-2xl">🧩</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{p.name}</h3>
                  <p className="text-sm text-zinc-400 truncate">{p.description}</p>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-amber-400 text-sm">{stars}</div>
                  <div className="text-lg font-bold text-white">{p.avgRating.toFixed(1)}</div>
                  <div className="text-xs text-zinc-500">{p.reviewCount} reviews</div>
                </div>
              </div>
            )
          })}
        </div>

        {projects.length === 0 && (
          <div className="border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-500 text-lg">No rankings yet.</p>
            <p className="text-zinc-600 text-sm mt-2">Be the first to review!</p>
          </div>
        )}
      </div>
    </main>
  )
}
