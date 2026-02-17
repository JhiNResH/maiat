'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'

export function TopNav() {
  const { authenticated, user, login, logout } = usePrivy()

  return (
    <nav className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-lg border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl">
              🪲
            </div>
            <div>
              <div className="font-bold text-xl text-white">MA'AT</div>
              <div className="text-xs text-zinc-500 -mt-1">Trust Layer</div>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/m/ai-agents" className="text-zinc-400 hover:text-white transition-colors">
              🤖 AI Agents
            </Link>
            <Link href="/m/defi" className="text-zinc-400 hover:text-white transition-colors">
              🏦 DeFi
            </Link>
          </div>

          {/* Auth Button */}
          <div>
            {authenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-zinc-400">
                  {user?.wallet?.address.slice(0, 6)}...{user?.wallet?.address.slice(-4)}
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
