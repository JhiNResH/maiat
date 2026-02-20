'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

interface TrustScoreData {
  score: number
  breakdown: {
    onChainActivity: number
    verifiedReviews: number
    communityTrust: number
    aiQuality: number
  }
  tokenAddress: string | null
  projectSlug: string | null
  timestamp: string
  metadata: {
    totalReviews: number
    verifiedReviewsCount: number
    avgRating: number
    totalUpvotes: number
  }
}

interface Review {
  id: string
  rating: number
  content: string
  upvotes: number
  createdAt: string
  reviewer: {
    displayName: string | null
    address: string
  }
  txHash: string | null
}

export default function TrustScorePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trustScoreData, setTrustScoreData] = useState<TrustScoreData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [animatedScore, setAnimatedScore] = useState(0)

  // Animate score when data loads
  useEffect(() => {
    if (trustScoreData) {
      let current = 0
      const target = trustScoreData.score
      const duration = 1000 // 1 second
      const steps = 50
      const increment = target / steps
      const stepDuration = duration / steps

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setAnimatedScore(target)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.floor(current))
        }
      }, stepDuration)

      return () => clearInterval(timer)
    }
  }, [trustScoreData])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setTrustScoreData(null)
    setReviews([])
    setAnimatedScore(0)

    try {
      // Fetch trust score
      const isAddress = query.trim().startsWith('0x')
      const param = isAddress ? `token=${query.trim()}` : `slug=${query.trim()}`
      
      const response = await fetch(`/api/trust-score?${param}`)
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || json.error || 'Failed to fetch trust score')
      }

      setTrustScoreData(json.data)

      // Fetch reviews for this project
      if (json.data.projectSlug) {
        // This is a simplified fetch - in real implementation, you'd have a separate API
        // For now, we'll just show the metadata
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-green-500'
    if (score >= 50) return 'border-yellow-500'
    return 'border-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1b23] border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0 hover:opacity-70 transition-opacity">
          <img src="/maiat-rmbg.png" alt="MAIAT" className="w-7 h-7 sm:w-8 sm:h-8" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight font-mono text-gray-900 dark:text-gray-100">MAIAT</h1>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <a href="https://t.me/MaiatBot" className="text-xs font-mono text-blue-600 hover:underline hidden sm:inline">@MaiatBot</a>
        </div>
      </header>

      <main className="px-3 sm:px-6 py-8 max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-100 mb-2">
            Trust Score Dashboard
          </h1>
          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
            Verify the trust score of any project by token address or slug
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter token address (0x...) or project slug"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 bg-white dark:bg-[#1a1b23]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-mono text-sm rounded-lg transition-colors"
            >
              {loading ? 'Loading...' : 'Check'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="text-sm font-mono text-red-600 dark:text-red-400">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Trust Score Display */}
        {trustScoreData && (
          <div className="space-y-6">
            {/* Score Circle */}
            <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg p-8">
              <div className="flex flex-col items-center">
                <div className={`relative w-48 h-48 rounded-full border-8 ${getScoreBorderColor(trustScoreData.score)} flex items-center justify-center mb-4`}>
                  <div className="text-center">
                    <div className={`text-6xl font-bold font-mono ${getScoreColor(trustScoreData.score)}`}>
                      {animatedScore}
                    </div>
                    <div className="text-sm font-mono text-gray-500 dark:text-gray-400">/ 100</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold font-mono ${getScoreColor(trustScoreData.score)} mb-1`}>
                    {getScoreLabel(trustScoreData.score)}
                  </div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {trustScoreData.tokenAddress && (
                      <div className="mt-2">
                        Token: {trustScoreData.tokenAddress.slice(0, 6)}...{trustScoreData.tokenAddress.slice(-4)}
                      </div>
                    )}
                    {trustScoreData.projectSlug && (
                      <div className="mt-1">
                        <Link href={`/ai-agent/${trustScoreData.projectSlug}`} className="text-blue-600 hover:underline">
                          View Project →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100 mb-4">
                Score Breakdown
              </h2>
              <div className="space-y-4">
                {/* On-Chain Activity */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      On-Chain Activity (40%)
                    </span>
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">
                      {trustScoreData.breakdown.onChainActivity}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${trustScoreData.breakdown.onChainActivity}%` }}
                    />
                  </div>
                </div>

                {/* Verified Reviews */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      Verified Reviews (30%)
                    </span>
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">
                      {trustScoreData.breakdown.verifiedReviews}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${trustScoreData.breakdown.verifiedReviews}%` }}
                    />
                  </div>
                </div>

                {/* Community Trust */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      Community Trust (20%)
                    </span>
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">
                      {trustScoreData.breakdown.communityTrust}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${trustScoreData.breakdown.communityTrust}%` }}
                    />
                  </div>
                </div>

                {/* AI Quality */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      AI Quality (10%)
                    </span>
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">
                      {trustScoreData.breakdown.aiQuality}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${trustScoreData.breakdown.aiQuality}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100 mb-4">
                Project Stats
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                    Total Reviews
                  </div>
                  <div className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">
                    {trustScoreData.metadata.totalReviews}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                    Verified
                  </div>
                  <div className="text-2xl font-bold font-mono text-green-600">
                    {trustScoreData.metadata.verifiedReviewsCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                    Avg Rating
                  </div>
                  <div className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">
                    {trustScoreData.metadata.avgRating.toFixed(1)} ⭐
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
                    Total Upvotes
                  </div>
                  <div className="text-2xl font-bold font-mono text-blue-600">
                    {trustScoreData.metadata.totalUpvotes}
                  </div>
                </div>
              </div>
            </div>

            {/* API Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-xs font-mono text-blue-800 dark:text-blue-300">
                💡 <strong>API Endpoint:</strong> GET /api/trust-score?token=0x... or ?slug=project-name
              </p>
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-2">
                Last updated: {new Date(trustScoreData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Example Queries */}
        {!trustScoreData && !loading && (
          <div className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100 mb-4">
              How it works
            </h2>
            <div className="space-y-3 text-sm font-mono text-gray-600 dark:text-gray-400">
              <p>
                <strong className="text-gray-900 dark:text-gray-100">1. On-Chain Activity (40%)</strong><br />
                Verified on-chain reviews, transaction hash presence
              </p>
              <p>
                <strong className="text-gray-900 dark:text-gray-100">2. Verified Reviews (30%)</strong><br />
                Review quality, recency, and active status
              </p>
              <p>
                <strong className="text-gray-900 dark:text-gray-100">3. Community Trust (20%)</strong><br />
                Upvotes and reviewer reputation
              </p>
              <p>
                <strong className="text-gray-900 dark:text-gray-100">4. AI Quality (10%)</strong><br />
                Baseline score from known projects and fundamentals
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="mt-8 text-center text-xs font-mono text-gray-400 dark:text-gray-500 py-4">
        Maiat — Trust Score Dashboard · 
        <a href="https://t.me/MaiatBot" className="text-blue-600 hover:underline ml-1">@MaiatBot</a> · 
        <Link href="/" className="text-blue-600 hover:underline ml-1">Home</Link>
      </div>
    </div>
  )
}
