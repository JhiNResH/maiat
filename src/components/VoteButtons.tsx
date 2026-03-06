'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { Loader2 } from 'lucide-react'

interface VoteButtonsProps {
  projectId: string
  projectName: string
  initialUpvotes?: number
  initialDownvotes?: number
}

export function VoteButtons({
  projectId,
  projectName,
  initialUpvotes = 0,
  initialDownvotes = 0,
}: VoteButtonsProps) {
  const { authenticated, user, login } = usePrivy()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedType, setVotedType] = useState<'upvote' | 'downvote' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const address = user?.wallet?.address

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!authenticated) { login(); return }
    if (!address || hasVoted || voting) return

    setVoting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, voteType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Vote failed')

      if (voteType === 'upvote') setUpvotes(prev => prev + 1)
      else setDownvotes(prev => prev + 1)
      setHasVoted(true)
      setVotedType(voteType)
      setSuccess(`${voteType === 'upvote' ? '👍' : '👎'} Voted! (-5 🪲 Scarab)`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => handleVote('upvote')}
          disabled={voting || hasVoted || !authenticated}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs transition-all ${
            votedType === 'upvote'
              ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
              : hasVoted
              ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800'
          }`}
          title="Upvote costs 5 Scarab"
        >
          {voting && votedType === null ? <Loader2 className="w-3 h-3 animate-spin" /> : '👍'}{' '}
          <span>{upvotes}</span>
        </button>

        <button
          onClick={() => handleVote('downvote')}
          disabled={voting || hasVoted || !authenticated}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs transition-all ${
            votedType === 'downvote'
              ? 'bg-red-100 text-red-700 border border-red-300 cursor-default'
              : hasVoted
              ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
              : 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800'
          }`}
          title="Downvote costs 5 Scarab"
        >
          {voting && votedType === null ? <Loader2 className="w-3 h-3 animate-spin" /> : '👎'}{' '}
          <span>{downvotes}</span>
        </button>

        {!authenticated && (
          <span className="text-xs font-mono text-gray-400 dark:text-zinc-500">Sign in to vote</span>
        )}
        {hasVoted && <span className="text-xs font-mono text-gray-400 dark:text-zinc-500">✓ Voted this week</span>}
      </div>

      {/* Inline feedback — no alert() */}
      {success && (
        <p className="text-xs font-mono text-green-500 dark:text-green-400">{success}</p>
      )}
      {error && (
        <p className="text-xs font-mono text-red-500 dark:text-red-400">❌ {error}</p>
      )}
    </div>
  )
}
