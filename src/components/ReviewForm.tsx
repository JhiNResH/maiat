'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface ReviewFormProps {
  projectId: string
  projectName: string
  onSuccess?: () => void
}

export function ReviewForm({ projectId, projectName, onSuccess }: ReviewFormProps) {
  const { authenticated, user, login } = usePrivy()
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const address = user?.wallet?.address

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          address,
          rating,
          content: content.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Review failed')

      // Success
      setContent('')
      setRating(5)
      if (onSuccess) onSuccess()
      alert(`✅ Review submitted! (-2 Scarab spent)`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center">
        <p className="text-zinc-400 mb-4">Sign in to review this project</p>
        <button
          onClick={login}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">Review {projectName}</h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm text-zinc-400 mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl transition-all ${
                star <= rating ? 'text-amber-400' : 'text-zinc-700'
              } hover:scale-110`}
            >
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
          <span className="ml-2 text-sm text-zinc-500 self-center">
            {rating === 1 && 'Unsafe/Broken'}
            {rating === 2 && 'Poor Quality'}
            {rating === 3 && 'Average'}
            {rating === 4 && 'Good'}
            {rating === 5 && 'Excellent'}
          </span>
        </div>
      </div>

      {/* Content (optional) */}
      <div className="mb-4">
        <label className="block text-sm text-zinc-400 mb-2">
          Review (optional)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience with this project..."
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
        />
        <div className="text-xs text-zinc-500 mt-1">
          {content.length}/500 characters
        </div>
      </div>

      {/* Cost Warning */}
      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg px-4 py-2 mb-4 text-sm text-amber-400">
        ⚠️ Submitting will cost <strong>2 Scarab 🪲</strong>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-2 mb-4 text-sm text-red-400">
          ❌ {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
      >
        {submitting ? '⏳ Submitting...' : '🚀 Submit Review (-2 🪲)'}
      </button>
    </form>
  )
}
