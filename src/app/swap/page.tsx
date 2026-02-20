'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowDown, Shield, AlertTriangle, Loader2, ChevronDown } from 'lucide-react'
import Link from 'next/link'

const TOKENS = [
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#627EEA' },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, color: '#2775CA' },
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, color: '#627EEA' },
  { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, color: '#F5AC37' },
  { symbol: 'cbBTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8, color: '#F7931A' },
  { symbol: 'AERO', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, color: '#0052FF' },
  { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, color: '#A36EFD' },
  { symbol: 'USDT', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6, color: '#26A17B' },
]

function TokenBadge({ token }: { token: typeof TOKENS[0] }) {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: token.color }}>
      {token.symbol[0]}
    </div>
  )
}

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
  const [tokenIn, setTokenIn] = useState(TOKENS[0])
  const [tokenOut, setTokenOut] = useState(TOKENS[1])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)

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
          chainId: 8453,
          swapper: address,
          type: 'EXACT_INPUT',
        }),
      })
      setResult(await res.json())
    } catch (e: any) {
      setResult({ allowed: false, error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const swapTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setResult(null)
  }

  const pickToken = (token: typeof TOKENS[0], side: 'from' | 'to') => {
    if (side === 'from') {
      if (token.symbol === tokenOut.symbol) swapTokens()
      else setTokenIn(token)
      setShowFromPicker(false)
    } else {
      if (token.symbol === tokenIn.symbol) swapTokens()
      else setTokenOut(token)
      setShowToPicker(false)
    }
    setResult(null)
  }

  const outputAmount = result?.quote?.quote?.output?.amount
    ? (Number(result.quote.quote.output.amount) / (10 ** tokenOut.decimals)).toFixed(4)
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center pt-16 px-4">
      {/* Nav */}
      <div className="w-full max-w-[480px] flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <img src="/maiat-rmbg.png" alt="MAIAT" className="w-7 h-7" />
          <span className="font-mono font-bold text-white text-sm">MAIAT</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 px-2 py-1 border border-zinc-800 rounded-full">Base</span>
          <span className="text-[10px] font-mono text-blue-400 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">Uniswap</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[480px] bg-[#131316] rounded-2xl p-1.5">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <span className="text-sm font-medium text-white">Swap</span>
          <span className="text-[10px] font-mono text-zinc-500">Trust-Gated</span>
        </div>

        {/* From */}
        <div className="bg-[#1b1b1f] rounded-xl p-4 mx-1.5 relative">
          <div className="text-xs text-zinc-500 mb-2">You pay</div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setResult(null) }}
              placeholder="0"
              className="flex-1 bg-transparent text-3xl font-light text-white outline-none placeholder-zinc-700 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => { setShowFromPicker(!showFromPicker); setShowToPicker(false) }}
              className="flex items-center gap-2 bg-[#2a2a2e] hover:bg-[#333338] pl-2 pr-2.5 py-1.5 rounded-full transition-colors shrink-0"
            >
              <TokenBadge token={tokenIn} />
              <span className="font-medium text-white text-sm">{tokenIn.symbol}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
          {showFromPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1b1b1f] border border-zinc-800 rounded-xl p-2 z-20 grid grid-cols-4 gap-1.5">
              {TOKENS.map(t => (
                <button key={t.symbol} onClick={() => pickToken(t, 'from')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-mono transition-colors ${t.symbol === tokenIn.symbol ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-300'}`}>
                  <TokenBadge token={t} />
                  {t.symbol}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center -my-2.5 relative z-10">
          <button onClick={swapTokens}
            className="w-9 h-9 bg-[#131316] border-4 border-[#0a0a0b] rounded-xl flex items-center justify-center hover:bg-[#1b1b1f] transition-colors">
            <ArrowDown className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* To */}
        <div className="bg-[#1b1b1f] rounded-xl p-4 mx-1.5 relative">
          <div className="text-xs text-zinc-500 mb-2">You receive</div>
          <div className="flex items-center gap-3">
            <span className={`flex-1 text-3xl font-light min-w-0 ${outputAmount ? 'text-white' : 'text-zinc-700'}`}>
              {outputAmount || '0'}
            </span>
            <button
              onClick={() => { setShowToPicker(!showToPicker); setShowFromPicker(false) }}
              className="flex items-center gap-2 bg-[#2a2a2e] hover:bg-[#333338] pl-2 pr-2.5 py-1.5 rounded-full transition-colors shrink-0"
            >
              <TokenBadge token={tokenOut} />
              <span className="font-medium text-white text-sm">{tokenOut.symbol}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
          {showToPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1b1b1f] border border-zinc-800 rounded-xl p-2 z-20 grid grid-cols-4 gap-1.5">
              {TOKENS.map(t => (
                <button key={t.symbol} onClick={() => pickToken(t, 'to')}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-mono transition-colors ${t.symbol === tokenOut.symbol ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-300'}`}>
                  <TokenBadge token={t} />
                  {t.symbol}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trust Score Result */}
        {result && (
          <div className={`mx-1.5 mt-1.5 p-3 rounded-xl ${
            result.allowed
              ? result.warning ? 'bg-yellow-500/5 border border-yellow-500/20' : 'bg-green-500/5 border border-green-500/20'
              : 'bg-red-500/5 border border-red-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {result.allowed ? (
                result.warning
                  ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  : <Shield className="w-3.5 h-3.5 text-green-500" />
              ) : <Shield className="w-3.5 h-3.5 text-red-500" />}
              <span className={`text-xs font-medium ${
                result.allowed ? result.warning ? 'text-yellow-400' : 'text-green-400' : 'text-red-400'
              }`}>
                {result.allowed ? (result.warning ? 'Caution' : 'Safe to Swap') : 'Blocked'}
              </span>
              {result.trustScore !== undefined && (
                <span className="ml-auto text-[10px] font-mono text-zinc-500">Trust {result.trustScore}/100</span>
              )}
            </div>
            {result.warning && <p className="text-[10px] font-mono text-zinc-500 mt-1">{result.warning}</p>}
            {result.error && <p className="text-[10px] font-mono text-red-400 mt-1">{result.error}</p>}
          </div>
        )}

        {/* Button */}
        <div className="p-1.5 pt-1">
          {!authenticated ? (
            <button onClick={login}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors text-sm">
              Connect Wallet
            </button>
          ) : (
            <button onClick={handleQuote} disabled={loading || !amount}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking Trust Score...</>
                : !amount ? 'Enter an amount'
                : result?.allowed ? 'Swap' : 'Get Quote'}
            </button>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-[480px] w-full mt-4 text-center">
        <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
          Trust score {'<'}30 → blocked · 30-60 → warning · {'>'}60 → safe · Powered by Uniswap API on Base
        </p>
      </div>
    </div>
  )
}
