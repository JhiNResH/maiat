import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Shield, Zap, Users, TrendingUp, ArrowRight, Star, MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

const categories = [
  {
    slug: 'openclaw-skills',
    title: 'OpenClaw Skills',
    emoji: '🧩',
    desc: 'AI coding tools & plugins',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    border: 'border-purple-500/30',
    accent: 'text-purple-400',
  },
  {
    slug: 'ai-agents',
    title: 'AI Agents',
    emoji: '🤖',
    desc: 'Autonomous agent rankings',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/30',
    accent: 'text-cyan-400',
  },
  {
    slug: 'memecoin',
    title: 'Memecoins',
    emoji: '🐸',
    desc: 'Community-driven token trust',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    accent: 'text-amber-400',
  },
  {
    slug: 'defi',
    title: 'DeFi Protocols',
    emoji: '🏦',
    desc: 'Protocol safety scores',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
  },
]

const features = [
  {
    icon: Shield,
    title: 'Stake to Review',
    desc: 'Put Scarab on the line. Skin in the game means honest signals.',
    color: 'text-emerald-400',
  },
  {
    icon: Zap,
    title: 'AI-Verified Quality',
    desc: 'Gemini validates every review. No spam, no fluff — only substance.',
    color: 'text-amber-400',
  },
  {
    icon: Users,
    title: 'Reputation That Matters',
    desc: 'Your trust score follows you. High rep = lower fees on-chain.',
    color: 'text-purple-400',
  },
  {
    icon: TrendingUp,
    title: 'Weekly Rankings',
    desc: 'Community consensus updated every week. Predict the top 10.',
    color: 'text-cyan-400',
  },
]

export default async function Home() {
  // Get live stats
  const [projectCount, reviewCount, userCount] = await Promise.all([
    prisma.project.count(),
    prisma.review.count(),
    prisma.user.count(),
  ])

  // Get top 5 projects across all categories
  const topProjects = await prisma.project.findMany({
    where: { status: 'approved' },
    orderBy: { avgRating: 'desc' },
    take: 5,
    include: { _count: { select: { reviews: true } } },
  })

  // Recent reviews
  const recentReviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      project: { select: { name: true, category: true } },
      reviewer: { select: { displayName: true, address: true } },
    },
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
        
        <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live on BSC Testnet
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-purple-300 via-white to-amber-300 bg-clip-text text-transparent">
              Trust Layer
            </span>
            <br />
            <span className="text-zinc-300">for Agentic Commerce</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Stake to review. Earn trust, not likes.
            <br />
            <span className="text-zinc-500">
              Human signals powering agent decisions — from DeFi protocols to memecoins.
            </span>
          </p>

          {/* Live Stats */}
          <div className="flex items-center justify-center gap-8 text-sm mb-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{projectCount}</div>
              <div className="text-zinc-500">Projects</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{reviewCount}</div>
              <div className="text-zinc-500">Reviews</div>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userCount}</div>
              <div className="text-zinc-500">Reviewers</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/m/openclaw-skills"
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              Start Reviewing
            </Link>
            <a
              href="https://github.com/JhiNResH/maatV2"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/m/${cat.slug}`}
              className={`group relative overflow-hidden rounded-xl border ${cat.border} bg-gradient-to-br ${cat.gradient} p-5 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="text-3xl mb-2">{cat.emoji}</div>
              <h3 className={`font-semibold ${cat.accent}`}>{cat.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">{cat.desc}</p>
              <ArrowRight className={`absolute bottom-4 right-4 w-5 h-5 ${cat.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">How Maat Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <f.icon className={`w-8 h-8 ${f.color} mb-3`} />
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Projects */}
      {topProjects.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top Rated</h2>
            <Link href="/m/openclaw-skills" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topProjects.map((p, i) => (
              <Link
                key={p.id}
                href={`/m/${p.category.replace('m/', '')}/${p.id}`}
                className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/30 rounded-xl p-4 transition-all"
              >
                <span className="text-lg font-bold text-zinc-600 w-6">#{i + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-lg">🧩</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{p.name}</h3>
                  <p className="text-xs text-zinc-500 truncate">{p.description}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-sm shrink-0">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {p.avgRating.toFixed(1)}
                </div>
                <div className="text-xs text-zinc-500 shrink-0">
                  {p._count.reviews} reviews
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold mb-6">Recent Reviews</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentReviews.map((r) => (
              <div key={r.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white truncate">{r.project.name}</span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-3 mb-3">{r.content}</p>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span className="text-amber-400">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                  <span>{r.reviewer.displayName || `${r.reviewer.address.slice(0, 6)}...`}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-sm text-zinc-600">
        <p>Maat 🪶 — The Feather of Truth for Web3</p>
        <p className="mt-1">Built for BNB Good Vibes Hackathon · Powered by Gemini AI + BSC</p>
      </footer>
    </main>
  )
}
