'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { X } from 'lucide-react'

/**
 * ScarabWelcomeBanner
 *
 * Shows a dismissible banner when a user connects for the first time
 * (no prior Scarab claims). Prompts them to claim their 20 free Scarab.
 *
 * Dismissed state is persisted in localStorage so it only shows once.
 */
export function ScarabWelcomeBanner() {
  const { authenticated, user } = usePrivy()
  const [show, setShow] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const address = user?.wallet?.address

  useEffect(() => {
    if (!authenticated || !address) {
      setShow(false)
      return
    }

    // Don't show if already dismissed for this address
    const dismissKey = `scarab_welcome_dismissed_${address}`
    if (localStorage.getItem(dismissKey)) return

    // Check if this is a first-time user (no prior claims)
    fetch(`/api/scarab/balance?address=${address}`)
      .then(r => r.json())
      .then(data => {
        if (data.totalEarned === 0 && data.lastClaimAt === null) {
          setShow(true)
        }
      })
      .catch(() => {})
  }, [authenticated, address])

  const handleDismiss = () => {
    if (address) localStorage.setItem(`scarab_welcome_dismissed_${address}`, '1')
    setShow(false)
  }

  const handleClaim = async () => {
    if (!address || claiming) return
    setClaiming(true)
    try {
      const res = await fetch('/api/scarab/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Claim failed')
      setClaimed(true)
      if (address) localStorage.setItem(`scarab_welcome_dismissed_${address}`, '1')
      setTimeout(() => setShow(false), 3000)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setClaiming(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="relative bg-gradient-to-r from-amber-900/90 to-orange-900/90 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-amber-400/60 hover:text-amber-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {claimed ? (
          <div className="text-center">
            <div className="text-3xl mb-2">🪲</div>
            <p className="text-amber-300 font-bold text-lg">+20 Scarab claimed!</p>
            <p className="text-amber-400/70 text-sm mt-1">Welcome to Maiat. Start reviewing to earn more.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="text-3xl">🪲</span>
              <div className="flex-1 min-w-0">
                <p className="text-amber-300 font-bold text-base leading-snug">
                  Claim your 20 free Scarab!
                </p>
                <p className="text-amber-400/70 text-sm mt-1 leading-relaxed">
                  New to Maiat? Scarab is your reputation currency — use it to stake reviews and unlock lower swap fees.
                </p>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
            >
              {claiming ? '⏳ Claiming...' : '🎁 Claim 20 Scarab — free for new users'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
