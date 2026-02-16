'use client'

import { useState } from 'react'
import { ExternalLink, Link2, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface OnChainBadgeProps {
  reviewId: string
  txHash?: string | null
  showVerifyButton?: boolean
}

export function OnChainBadge({ reviewId, txHash, showVerifyButton = false }: OnChainBadgeProps) {
  const [verifying, setVerifying] = useState(false)
  const [localTxHash, setLocalTxHash] = useState(txHash)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/verify`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLocalTxHash(data.txHash)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setVerifying(false)
    }
  }

  // Already verified on-chain
  if (localTxHash) {
    return (
      <a
        href={`https://testnet.bscscan.com/tx/${localTxHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full hover:bg-emerald-500/20 transition-colors"
        title="Verified on BSC Testnet"
      >
        <CheckCircle2 className="w-3 h-3" />
        On-Chain
        <ExternalLink className="w-3 h-3" />
      </a>
    )
  }

  // Show verify button
  if (showVerifyButton) {
    return (
      <div className="inline-flex items-center gap-2">
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs px-2.5 py-1 rounded-full hover:border-purple-500/40 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          {verifying ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Link2 className="w-3 h-3" />
              Verify On-Chain
            </>
          )}
        </button>
        {error && (
          <span className="inline-flex items-center gap-1 text-xs text-red-400">
            <XCircle className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>
    )
  }

  // No tx, no button — show off-chain indicator
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
      <Link2 className="w-3 h-3" />
      Off-chain
    </span>
  )
}
