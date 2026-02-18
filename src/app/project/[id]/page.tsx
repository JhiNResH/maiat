import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) return { title: 'Not Found | Maiat' }
  
  const trustScore = Math.round(project.avgRating * 20)
  return {
    title: `${project.name} Trust Score & Reviews | Maiat`,
    description: `${project.name} has a trust score of ${trustScore}/100 based on ${project.reviewCount} verified reviews on Maiat.`,
  }
}

export default async function ProjectPage({ params }: Props) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
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
  const categoryLabel = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : project.category

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center gap-6">
        <Link href="/" className="text-2xl font-bold tracking-tight font-mono hover:opacity-70">MAIAT</Link>
        <div className="flex-1 max-w-2xl">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:border-gray-500"
          />
        </div>
      </header>

      <main className="px-6 py-6 max-w-4xl">
        {/* Project Header */}
        <div className="mb-2">
          <Link href="/" className="text-xs text-gray-400 font-mono hover:text-gray-600">← Back</Link>
        </div>
        <h2 className="text-3xl font-bold font-mono text-gray-900 mb-1">{project.name}</h2>
        <div className="flex items-center gap-4 text-xs text-gray-500 font-mono uppercase tracking-widest mb-6">
          <span>Category: {categoryLabel}</span>
          <span>{project.reviewCount} Reviews</span>
        </div>

        {/* Trust Score Card */}
        <div className="border border-gray-200 rounded-md p-6 mb-8">
          <div className="text-xs font-bold tracking-widest text-gray-500 uppercase font-mono mb-3">Trust Score</div>
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-12 rounded-full ${barColor}`} />
            <span className={`text-5xl font-bold font-mono ${scoreColor}`}>{trustScore}</span>
          </div>
          <div className="mt-2 text-sm text-gray-500 font-mono">
            Avg Rating: {project.avgRating.toFixed(1)} / 5.0
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-4">
          <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase font-mono mb-4">Reviews</h3>
        </div>

        {project.reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400 font-mono text-sm border border-gray-200 rounded-md">
            No reviews yet. Be the first — message @MaiatBot on Telegram.
          </div>
        ) : (
          <div className="space-y-0">
            {project.reviews.map((review) => {
              const displayAddr = review.reviewer.address.startsWith('tg:')
                ? review.reviewer.displayName || `tg:${review.reviewer.address.slice(3, 7)}...`
                : `${review.reviewer.address.slice(0, 6)}...${review.reviewer.address.slice(-4)}`
              const date = new Date(review.createdAt).toISOString().split('T')[0]

              return (
                <div key={review.id} className="border-b border-gray-100 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-gray-900">{displayAddr}</span>
                      <span className="text-xs font-mono text-green-600">Rating: {review.rating}.0</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                      <span>{date}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 font-mono leading-relaxed">{review.content}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 font-mono">
            Want to review {project.name}? Message <a href="https://t.me/MaiatBot" className="text-blue-600 hover:underline">@MaiatBot</a> on Telegram.
          </p>
        </div>
      </main>
    </div>
  )
}
