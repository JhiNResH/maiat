'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface ScarabBalance {
  balance: number
  totalEarned: number
  totalSpent: number
  streak: number
  lastClaimAt: string | null
}

export function ScarabWidget() {
  const { authenticated, user } = usePrivy()
  const [balance, setBalance] = useState<ScarabBalance | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<{ amount: number; streak: number } | null>(null)

  const address = user?.wallet?.address

  useEffect(() => {
    if (address) {
      fetchBalance()
    }
  }, [address])

  const fetchBalance = async () => {
    if (!address) return
    try {
      const res = await fetch(`/api/scarab/balance?address=${address}`)
      const data = await res.json()
      setBalance(data)
    } catch (e) {
      console.error('Failed to fetch Scarab balance:', e)
    }
  }

  const handleClaim = async () => {
    if (!address) return
    setClaiming(true)
    setClaimResult(null)
    try {
      const res = await fetch('/api/scarab/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Claim failed')
      
      setClaimResult({ amount: data.amount, streak: data.streak })
      fetchBalance() // Refresh
    } catch (e: any) {
      alert(e.message)
    } finally {
      setClaiming(false)
    }
  }

  if (!authenticated) {
    return null
  }

  const canClaim = balance && (!balance.lastClaimAt || !isSameDay(new Date(balance.lastClaimAt), new Date()))

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 min-w-[200px]">
        {/* Balance */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-zinc-500">Scarab Balance</div>
            <div className="text-2xl font-bold text-amber-400 flex items-center gap-1">
              🪲 {balance?.balance ?? 0}
            </div>
          </div>
        </div>

        {/* Claim Button */}
        {canClaim ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg disabled:cursor-not-allowed"
          >
            {claiming ? '⏳ Claiming...' : '🎁 Claim Daily +5'}
          </button>
        ) : (
          <div className="text-xs text-zinc-500 text-center py-2 bg-zinc-800 rounded-lg">
            ✓ Claimed today
          </div>
        )}

        {/* Claim Result */}
        {claimResult && (
          <div className="mt-2 text-xs bg-emerald-900/30 text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/30 animate-pulse">
            +{claimResult.amount} Scarab claimed! 🎉
            {claimResult.streak > 1 && (
              <div className="text-[10px] text-emerald-400/80 mt-1">
                🔥 {claimResult.streak} day streak!
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {balance && (
          <div className="mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span>Earned:</span>
              <span className="text-emerald-400">+{balance.totalEarned}</span>
            </div>
            <div className="flex justify-between">
              <span>Spent:</span>
              <span className="text-red-400">-{balance.totalSpent}</span>
            </div>
            {balance.streak > 0 && (
              <div className="flex justify-between">
                <span>Streak:</span>
                <span className="text-orange-400">🔥 {balance.streak} days</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}
