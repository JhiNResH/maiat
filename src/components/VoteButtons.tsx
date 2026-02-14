'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

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

  const address = user?.wallet?.address

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!authenticated) {
      login()
      return
    }

    if (!address) return

    setVoting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, voteType }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Vote failed')

      // Update counts optimistically
      if (voteType === 'upvote') {
        setUpvotes(upvotes + 1)
      } else {
        setDownvotes(downvotes + 1)
      }

      setHasVoted(true)
      alert(`✅ Vote recorded! (-5 Scarab spent)`)
    } catch (e: any) {
      alert(`❌ ${e.message}`)
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => handleVote('upvote')}
        disabled={voting || hasVoted}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all
          ${
            hasVoted
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-500/30'
          }
        `}
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{upvotes}</span>
      </button>

      <button
        onClick={() => handleVote('downvote')}
        disabled={voting || hasVoted}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all
          ${
            hasVoted
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/30'
          }
        `}
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{downvotes}</span>
      </button>

      {!authenticated && (
        <span className="text-xs text-zinc-500">• Sign in to vote (5 🪲)</span>
      )}
      {hasVoted && <span className="text-xs text-zinc-500">• Voted ✓</span>}
    </div>
  )
}
