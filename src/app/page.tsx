import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { reviewCount: 'desc' },
    where: { status: 'approved' },
  })

  // Fallback: if no approved, show all
  const allProjects = projects.length > 0 ? projects : await prisma.project.findMany({
    orderBy: { reviewCount: 'desc' },
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center gap-6">
        <h1 className="text-2xl font-bold tracking-tight font-mono">MAIAT</h1>
        <div className="flex-1 max-w-2xl">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:border-gray-500"
          />
        </div>
      </header>

      {/* Table */}
      <main className="px-6 py-6">
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase font-mono">Project Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase font-mono">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase font-mono">Trust Score</th>
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase font-mono">Reviews</th>
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest text-gray-500 uppercase font-mono">Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map((project) => {
                const trustScore = Math.round(project.avgRating * 20)
                const scoreColor = trustScore >= 80 ? 'text-green-600' : trustScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                const barColor = trustScore >= 80 ? 'bg-green-500' : trustScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                const categoryLabel = project.category === 'm/ai-agents' ? 'AI Agent' : project.category === 'm/defi' ? 'DeFi' : project.category

                return (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <Link href={`/project/${project.id}`} className="text-sm font-medium text-gray-900 hover:text-black font-mono">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 font-mono">{categoryLabel}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-6 rounded-full ${barColor}`} />
                        <span className={`text-sm font-bold font-mono ${scoreColor}`}>{trustScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-mono">{project.reviewCount}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-mono">{project.avgRating.toFixed(1)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {allProjects.length === 0 && (
          <div className="text-center py-12 text-gray-400 font-mono text-sm">
            No projects yet.
          </div>
        )}
      </main>
    </div>
  )
}
