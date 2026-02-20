'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowDown, Shield, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const POPULAR_TOKENS = [
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, logo: '⟠' },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, logo: '💲' },
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, logo: '⟠' },
]

interface QuoteResult {
  allowed: boolean
  trustScore?: number
  riskLevel?: string
  warning?: string
  quote?: any
  error?: string
}

export default function SwapPage() {
  const { authenticated, user, login } = usePrivy()
  const [tokenIn, setTokenIn] = useState(POPULAR_TOKENS[0])
  const [tokenOut, setTokenOut] = useState(POPULAR_TOKENS[1])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResult | null>(null)

  const address = user?.wallet?.address

  const handleQuote = async () => {
    if (!amount || !address) return
    setLoading(true)
    setResult(null)

    try {
      const amountWei = BigInt(Math.floor(parseFloat(amount) * (10 ** tokenIn.decimals))).toString()

      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amount: amountWei,
          chainId: 8453, // Base
          swapper: address,
          type: 'EXACT_INPUT',
        }),
      })

      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ allowed: false, error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const swapTokens = () => {
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b] pt-[80px] px-4">
      <div className="max-w-md mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-[#6b6b70] hover:text-gray-900 dark:hover:text-white mb-6 transition-colors text-sm font-mono">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">Trust-Gated Swap</h1>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono rounded">
            Powered by Uniswap
          </span>
        </div>

        <p className="text-gray-500 dark:text-[#6b6b70] text-xs font-mono mb-6">
          Maiat checks trust scores before you swap. Low-trust tokens are flagged or blocked.
        </p>

        {/* Swap Card */}
        <div className="bg-gray-50 dark:bg-[#111113] border border-gray-200 dark:border-[#1f1f23] rounded-xl p-4 space-y-3">
          {/* Token In */}
          <div className="bg-white dark:bg-[#0a0a0b] rounded-lg p-4 border border-gray-100 dark:border-[#1f1f23]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 dark:text-[#6b6b70] text-xs font-mono">You pay</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setResult(null) }}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-mono text-gray-900 dark:text-white outline-none placeholder-gray-300 dark:placeholder-[#2a2a2e]"
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#1f1f23] rounded-lg">
                <span className="text-lg">{tokenIn.logo}</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white text-sm">{tokenIn.symbol}</span>
              </div>
            </div>
          </div>

          {/* Swap Direction */}
          <div className="flex justify-center -my-1">
            <button
              onClick={swapTokens}
              className="p-2 bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-[#2a2a2e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2e] transition-colors"
            >
              <ArrowDown className="w-4 h-4 text-gray-500 dark:text-[#6b6b70]" />
            </button>
          </div>

          {/* Token Out */}
          <div className="bg-white dark:bg-[#0a0a0b] rounded-lg p-4 border border-gray-100 dark:border-[#1f1f23]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 dark:text-[#6b6b70] text-xs font-mono">You receive</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex-1 text-2xl font-mono text-gray-400 dark:text-[#6b6b70]">
                {result?.quote?.quote?.output?.amount 
                  ? (Number(result.quote.quote.output.amount) / (10 ** tokenOut.decimals)).toFixed(4)
                  : '0.0'}
              </span>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#1f1f23] rounded-lg">
                <span className="text-lg">{tokenOut.logo}</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white text-sm">{tokenOut.symbol}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Score Result */}
        {result && (
          <div className={`mt-4 p-4 rounded-xl border ${
            result.allowed
              ? result.warning
                ? 'bg-yellow-50 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/20'
                : 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20'
              : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.allowed ? (
                result.warning ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Shield className="w-4 h-4 text-green-500" />
                )
              ) : (
                <Shield className="w-4 h-4 text-red-500" />
              )}
              <span className={`font-mono text-sm font-medium ${
                result.allowed
                  ? result.warning ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {result.allowed ? (result.warning ? 'Caution' : 'Safe to Swap') : 'Swap Blocked'}
              </span>
              {result.trustScore !== undefined && (
                <span className="ml-auto font-mono text-xs text-gray-500">
                  Trust: {result.trustScore}/100
                </span>
              )}
            </div>
            {result.warning && (
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">{result.warning}</p>
            )}
            {result.error && (
              <p className="text-xs font-mono text-red-600 dark:text-red-400">{result.error}</p>
            )}
            {result.quote?.routing && (
              <p className="text-xs font-mono text-gray-500 mt-1">Route: {result.quote.routing}</p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          {!authenticated ? (
            <button
              onClick={login}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-mono font-medium rounded-xl transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={handleQuote}
              disabled={loading || !amount}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking Trust Score...
                </>
              ) : result?.allowed ? (
                'Swap'
              ) : (
                'Get Quote'
              )}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-[#111113] border border-gray-200 dark:border-[#1f1f23] rounded-lg">
          <p className="text-[10px] font-mono text-gray-400 dark:text-[#6b6b70] leading-relaxed">
            🔍 Maiat checks trust scores via on-chain data + community reviews before executing swaps.
            Powered by Uniswap API on Base. Tokens with trust score below 30 are blocked.
            30-60 get a warning. Above 60 are safe to swap.
          </p>
        </div>
      </div>
    </div>
  )
}
