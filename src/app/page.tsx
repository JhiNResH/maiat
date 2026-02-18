import { prisma } from '@/lib/prisma'
import { calculateTrustScore } from '@/lib/trust-score'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchBar } from '@/components/SearchBar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const allProjects = await prisma.project.findMany({
    where: q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ]
    } : undefined,
    orderBy: { reviewCount: 'desc' },
  })

  const totalReviews = allProjects.reduce((sum, p) => sum + p.reviewCount, 0)
  const totalProjects = allProjects.length
  const avgTrustScore = allProjects.length > 0
    ? Math.round(allProjects.reduce((sum, p) => sum + calculateTrustScore(p.name, p.category, p.avgRating, p.reviewCount), 0) / allProjects.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1b23] border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity">
          <img src="/maiat-rmbg.png" alt="MAIAT" className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight font-mono text-gray-900 dark:text-gray-100">MAIAT</h1>
        </Link>
        <div className="flex-1 flex justify-center px-8">
          <SearchBar />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <a href="https://t.me/MaiatBot" className="text-xs font-mono text-blue-600 hover:underline">@MaiatBot</a>
        </div>
      </header>

      <main className="px-6 py-4 max-w-5xl mx-auto">
        {/* Stats Bar */}
        <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-md mb-4 p-3">
          <div className="flex items-center gap-8 text-xs font-mono">
            <div>
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Projects: </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{totalProjects}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Reviews: </span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{totalReviews}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Avg Trust Score: </span>
              <span className="font-bold text-green-600">{avgTrustScore}/100</span>
            </div>
            <div className="ml-auto">
              <span className="text-gray-400 dark:text-gray-500">The trust score layer for agentic commerce</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0f1117]">
            <span className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase font-mono">
              All Projects ({totalProjects})
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase font-mono">#</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase font-mono">Project</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase font-mono">Category</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase font-mono">Trust Score</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase font-mono">Reviews</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase font-mono">Rating</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase font-mono">Risk</th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map((project, i) => {
                const trustScore = calculateTrustScore(project.name, project.category, project.avgRating, project.reviewCount)
                const scoreColor = trustScore >= 80 ? 'text-green-600' : trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                const barColor = trustScore >= 80 ? 'bg-green-500' : trustScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                const riskLevel = trustScore >= 80 ? 'Low' : trustScore >= 50 ? 'Medium' : 'High'
                const riskColor = trustScore >= 80 ? 'text-green-600' : trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                const categoryLabel = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : project.category

                return (
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/${project.category === 'm/ai-agents' ? 'ai-agent' : 'defi'}/${(project as any).slug || project.id}`} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline font-mono">
                        {project.image ? (
                          <img src={project.image} alt="" className="w-5 h-5 rounded" />
                        ) : (
                          <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            {project.name.slice(0, 2)}
                          </div>
                        )}
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">{categoryLabel}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-0.5 h-4 rounded-full ${barColor}`} />
                        <span className={`text-sm font-bold font-mono ${scoreColor}`}>{trustScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 font-mono">{project.reviewCount}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 font-mono">{project.avgRating.toFixed(1)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-mono ${riskColor}`}>{riskLevel}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs font-mono text-gray-400 dark:text-gray-500 py-4">
          Maiat — Verified review layer for agentic commerce · 
          <a href="https://t.me/MaiatBot" className="text-blue-600 hover:underline ml-1">@MaiatBot</a> · 
          <a href="https://x.com/0xmaiat" target="_blank" rel="noopener" className="text-blue-600 hover:underline ml-1">@0xmaiat</a> · 
          <span className="ml-1">API: /api/trust-score</span>
        </div>
      </main>
    </div>
  )
}
