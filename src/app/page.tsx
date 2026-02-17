import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { LeaderboardPreview } from '@/components/leaderboard/LeaderboardPreview'
import { Feed } from '@/components/reviews/Feed'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Get live stats
  const [projectCount, reviewCount, userCount] = await Promise.all([
    prisma.project.count({ where: { status: 'approved' } }),
    prisma.review.count(),
    prisma.user.count(),
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Main Layout (Reddit Style) */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          
          {/* Main Feed (Center) */}
          <main>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Latest Reviews</h2>
              <div className="flex gap-2">
                 <button className="px-3 py-1.5 bg-[#1f1f23] rounded-full text-xs font-medium hover:bg-[#2a2a2e] transition-colors">Hot</button>
                 <button className="px-3 py-1.5 text-[#6b6b70] hover:bg-[#1a1a1d] rounded-full text-xs font-medium transition-colors">New</button>
                 <button className="px-3 py-1.5 text-[#6b6b70] hover:bg-[#1a1a1d] rounded-full text-xs font-medium transition-colors">Top</button>
              </div>
            </div>
            
            {/* Feed Component */}
            <Feed />
          </main>

          {/* Right Sidebar (Widgets) */}
          <aside className="space-y-6 hidden lg:block">
            {/* Platform Stats Widget */}
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-[#111113] border border-[#1f1f23] rounded-lg">
                  <div className="text-[10px] text-[#6b6b70] uppercase tracking-wider font-semibold mb-1">Verified</div>
                  <div className="text-lg font-mono font-bold text-white">{projectCount}</div>
               </div>
               <div className="p-4 bg-[#111113] border border-[#1f1f23] rounded-lg">
                  <div className="text-[10px] text-[#6b6b70] uppercase tracking-wider font-semibold mb-1">Reviews</div>
                  <div className="text-lg font-mono font-bold text-white">{reviewCount}</div>
               </div>
               <div className="col-span-2 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Trust Verified</span>
                    <span className="text-xl font-mono font-bold text-white">{userCount}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
               </div>
            </div>

            {/* Leaderboard Widget */}
            <div className="bg-[#111113] border border-[#1f1f23] rounded-lg overflow-hidden">
               <div className="p-3 border-b border-[#1f1f23] flex items-center justify-between bg-[#1a1a1d]">
                 <span className="text-xs font-bold uppercase tracking-wider text-[#adadb0]">Top Rated</span>
                 <Link href="/m/ai-agents" className="text-[10px] text-purple-400 hover:text-purple-300">View All</Link>
               </div>
               <div className="p-4">
                 <LeaderboardPreview />
               </div>
            </div>

            {/* Categories Widget */}
            <div className="bg-[#111113] border border-[#1f1f23] rounded-lg p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#adadb0] mb-4">Browse Categories</h3>
              <div className="space-y-2">
                <Link 
                  href="/m/ai-agents"
                  className="flex items-center gap-2 p-2 hover:bg-[#1a1a1d] rounded-lg transition-colors text-sm"
                >
                  <span className="text-lg">🤖</span>
                  <span className="text-[#adadb0]">AI Agents</span>
                </Link>
                <Link 
                  href="/m/defi"
                  className="flex items-center gap-2 p-2 hover:bg-[#1a1a1d] rounded-lg transition-colors text-sm"
                >
                  <span className="text-lg">🏦</span>
                  <span className="text-[#adadb0]">DeFi Protocols</span>
                </Link>
              </div>
            </div>

            {/* Footer Links Widget */}
            <div className="text-xs text-[#6b6b70] leading-relaxed px-2">
               <div className="flex flex-wrap gap-2 mb-2">
                 <Link href="https://github.com/JhiNResH/maiat" className="hover:underline">GitHub</Link>
                 <Link href="#" className="hover:underline">Docs</Link>
                 <Link href="#" className="hover:underline">API</Link>
               </div>
               <div className="flex flex-wrap gap-2">
                 <Link href="#" className="hover:underline">Terms</Link>
                 <Link href="#" className="hover:underline">Privacy</Link>
                 <Link href="#" className="hover:underline">Security</Link>
               </div>
               <div className="mt-4">
                 © 2026 Maiat 🪲 — Trust Layer for Agentic Commerce
               </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
