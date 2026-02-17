'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Copy } from 'lucide-react'
import { ScarabWidget } from '@/components/ScarabWidget'

interface UserStats {
  reviewCount: number
  avgRating: number
  totalStaked: number
}

export default function UserPassportPage() {
  const params = useParams()
  const address = params.address as string
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        // TODO: Create API endpoint for user stats
        // const res = await fetch(`/api/users/${address}/stats`)
        // const data = await res.json()
        // setStats(data)
        
        // Placeholder data for now
        setStats({
          reviewCount: 0,
          avgRating: 0,
          totalStaked: 0,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setStats({
          reviewCount: 0,
          avgRating: 0,
          totalStaked: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    if (address) {
      fetchStats()
    }
  }, [address])

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 animate-pulse bg-purple-500/20 rounded-lg" />
          <p className="text-[#adadb0]">Loading passport...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] py-10 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Logo/Avatar */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center text-4xl">
              🪲
            </div>
          </div>

          {/* Address */}
          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-2 mx-auto text-[#adadb0] hover:text-white transition-colors group mb-2"
          >
            <span className="font-mono text-lg">{shortAddress}</span>
            <Copy className="w-4 h-4 group-hover:text-purple-400" />
          </button>
          {copied && <p className="text-purple-400 text-sm mt-2">Copied!</p>}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Stats */}
          <div className="space-y-6">
            {/* Main Stats Card */}
            <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-8">
              <h3 className="text-sm font-bold tracking-widest text-[#6b6b70] uppercase mb-6">
                Activity Stats
              </h3>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{stats?.reviewCount || 0}</p>
                  <p className="text-xs text-[#adadb0] uppercase mt-1">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {stats?.avgRating ? stats.avgRating.toFixed(1) : '0.0'}
                  </p>
                  <p className="text-xs text-[#adadb0] uppercase mt-1">Avg Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-400">{stats?.totalStaked || 0}</p>
                  <p className="text-xs text-[#adadb0] uppercase mt-1">Staked</p>
                </div>
              </div>
            </div>

            {/* Recent Activity - Placeholder */}
            <div className="bg-[#111113] border border-[#1f1f23] rounded-xl p-6">
              <h3 className="text-sm font-bold tracking-widest text-[#6b6b70] uppercase mb-4">
                Recent Activity
              </h3>
              <p className="text-sm text-[#6b6b70] text-center py-8">
                No recent activity
              </p>
            </div>
          </div>

          {/* Right Column - Scarab Balance */}
          <div className="space-y-6">
            {/* Scarab Balance Card */}
            <div className="sticky top-20">
              <ScarabWidget embedded />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
