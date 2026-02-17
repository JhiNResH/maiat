'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Trophy } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  image: string | null
  category: string
  status: 'approved' | 'pending' | 'rejected'
  avgRating: number
  reviewCount: number
  website: string | null
}

const categoryMeta: Record<string, { title: string; desc: string; icon: string }> = {
  'ai-agents': {
    title: 'AI Agents',
    desc: 'Autonomous agents ranked by reliability, safety, and performance.',
    icon: '🤖',
  },
  'defi': {
    title: 'DeFi Protocols',
    desc: 'Trust scores for DeFi protocols based on verified on-chain usage.',
    icon: '🏦',
  },
}

export default function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const categorySlug = params.category
  const cat = `m/${categorySlug}`
  const meta = categoryMeta[categorySlug] || { title: categorySlug, desc: '', icon: '📦' }

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch(`/api/projects?category=${cat}`)
        const data = await res.json()
        setProjects(data.projects || [])
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [cat])

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const approved = filteredProjects.filter(p => p.status === 'approved')
  const pending = filteredProjects.filter(p => p.status === 'pending')
  const flagged = filteredProjects.filter(p => p.status === 'rejected')

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <div className="border-b border-[#1f1f23] sticky top-[65px] z-40 bg-[#0a0a0b]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{meta.icon}</span>
              <div>
                <h1 className="text-3xl font-bold">{meta.title}</h1>
                <p className="text-[#adadb0] text-sm mt-1">
                  {projects.length} projects • {approved.length} verified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/m/${categorySlug}/leaderboard`}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg font-medium transition border border-amber-500/30"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
              <button
                onClick={() => window.location.href = `/m/${categorySlug}?mode=create`}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-[#adadb0] mb-4">{meta.desc}</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#6b6b70]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1f1f23] border border-[#2a2a2e] rounded-lg text-white placeholder-[#6b6b70] focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 text-sm">
            <span className="text-emerald-400">🟢 {approved.length} verified</span>
            <span className="text-amber-400">🟡 {pending.length} pending</span>
            <span className="text-red-400">🔴 {flagged.length} flagged</span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-[#adadb0]">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#adadb0] mb-4">No projects found</p>
            <button
              onClick={() => window.location.href = `/m/${categorySlug}?mode=create`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/m/${categorySlug}/${project.id}`}
                className="group"
              >
                <div className="bg-[#1f1f23] border border-[#2a2a2e] rounded-lg p-4 hover:border-purple-500/50 hover:bg-[#2a2a2e] transition cursor-pointer">
                  {/* Logo + Name */}
                  <div className="flex items-start gap-3 mb-4">
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl">
                        {meta.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate group-hover:text-purple-400 transition">
                        {project.name}
                      </h3>
                      <p className="text-xs text-[#6b6b70] capitalize">
                        {project.status}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-[#adadb0] line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 text-sm">
                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#adadb0]">Rating</span>
                      <span className="font-semibold text-purple-400">
                        {project.avgRating > 0 ? `${project.avgRating.toFixed(1)} / 5` : 'No ratings'}
                      </span>
                    </div>

                    {/* Reviews */}
                    <div className="flex items-center justify-between">
                      <span className="text-[#adadb0]">Reviews</span>
                      <span className="font-semibold">{project.reviewCount}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-2 border-t border-[#2a2a2e]">
                      {project.status === 'approved' && (
                        <span className="text-xs text-emerald-400">✅ Verified Safe</span>
                      )}
                      {project.status === 'pending' && (
                        <span className="text-xs text-amber-400">⏳ Pending Review</span>
                      )}
                      {project.status === 'rejected' && (
                        <span className="text-xs text-red-400">⚠️ Flagged</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
