import { prisma } from '@/lib/prisma'
import { SkillCard } from '@/components/SkillCard'

const categoryMeta: Record<string, { title: string; desc: string }> = {
  'openclaw-skills': {
    title: '🧩 OpenClaw Skills & Plugins',
    desc: 'Community-curated trust ratings for AI coding tools. Stake to review. Earn trust, not likes.',
  },
  'ai-agents': {
    title: '🤖 AI Agents',
    desc: 'Autonomous agents ranked by reliability, safety, and performance.',
  },
  'memecoin': {
    title: '🐸 Memecoins',
    desc: 'Community-driven rankings of meme tokens. Skin in the game required.',
  },
  'defi': {
    title: '🏦 DeFi Protocols',
    desc: 'Trust scores for DeFi protocols based on verified on-chain usage.',
  },
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const cat = `m/${params.category}`
  const meta = categoryMeta[params.category] || { title: params.category, desc: '' }

  const projects = await prisma.project.findMany({
    where: { category: cat },
    orderBy: [
      { status: 'asc' }, // approved first, then pending, then rejected
      { avgRating: 'desc' },
    ],
  })

  const approved = projects.filter(p => p.status === 'approved')
  const pending = projects.filter(p => p.status === 'pending')
  const flagged = projects.filter(p => p.status === 'rejected')

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{meta.title}</h1>
          <p className="text-zinc-400 mt-2">{meta.desc}</p>
          <div className="flex gap-4 mt-4 text-sm text-zinc-500">
            <span className="text-emerald-400">🟢 {approved.length} verified</span>
            <span className="text-amber-400">🟡 {pending.length} unreviewed</span>
            <span className="text-red-400">🔴 {flagged.length} flagged</span>
          </div>
        </div>

        {/* Verified Safe */}
        {approved.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-emerald-400 mb-3">✅ Verified Safe</h2>
            <div className="grid gap-3">
              {approved.map(p => (
                <SkillCard
                  key={p.id}
                  name={p.name}
                  description={p.description || ''}
                  image={p.image}
                  status="approved"
                  avgRating={p.avgRating}
                  reviewCount={p.reviewCount}
                  website={p.website}
                />
              ))}
            </div>
          </section>
        )}

        {/* Unreviewed */}
        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-amber-400 mb-3">⏳ Unreviewed — Need Your Input</h2>
            <div className="grid gap-3">
              {pending.map(p => (
                <SkillCard
                  key={p.id}
                  name={p.name}
                  description={p.description || ''}
                  image={p.image}
                  status="pending"
                  avgRating={p.avgRating}
                  reviewCount={p.reviewCount}
                  website={p.website}
                />
              ))}
            </div>
          </section>
        )}

        {/* Flagged */}
        {flagged.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-red-400 mb-3">⚠️ Flagged — Community Warnings</h2>
            <p className="text-xs text-red-400/60 mb-3">
              These skills have been flagged by the community for suspicious behavior including data exfiltration, credential theft, or prompt injection.
            </p>
            <div className="grid gap-3">
              {flagged.map(p => (
                <SkillCard
                  key={p.id}
                  name={p.name}
                  description={p.description || ''}
                  image={p.image}
                  status="rejected"
                  avgRating={p.avgRating}
                  reviewCount={p.reviewCount}
                  website={p.website}
                />
              ))}
            </div>
          </section>
        )}

        {projects.length === 0 && (
          <div className="border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-500 text-lg">No items in this category yet.</p>
            <p className="text-zinc-600 text-sm mt-2">Be the first to review something here.</p>
          </div>
        )}
      </div>
    </main>
  )
}
