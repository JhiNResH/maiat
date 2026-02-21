'use client'

/**
 * x402 + Kite AI Demo Page
 *
 * Visual demo of autonomous agent micropayments using the x402 protocol.
 * Shows the complete flow: request → 402 → pay → verify → receive data.
 *
 * Route: /x402-demo
 */

import { useState } from 'react'

interface PaymentStep {
  id: number
  label: string
  detail: string
  status: 'pending' | 'active' | 'done' | 'error'
  code?: string
}

interface TrustResult {
  payment: {
    txHash: string
    from: string
    demo: boolean
    kiteExplorerUrl?: string
    amount: string
    chainId: number
  }
  data: {
    score: number
    reviewCount: number
    avgRating: number
    project?: { name: string; description?: string }
  }
}

const DEMO_PROJECTS = [
  { slug: 'jerrys-coffee',    label: "Jerry's Coffee",   emoji: '☕' },
  { slug: 'blockchain-beans', label: 'Blockchain Beans', emoji: '🫘' },
  { slug: 'aixbt',            label: 'AIXBT',            emoji: '🤖' },
  { slug: 'uniswap',          label: 'Uniswap',          emoji: '🦄' },
]

const DEMO_AGENTS = [
  { id: 'agent-alpha',  label: 'Agent Alpha',  emoji: '🤖', color: '#6366f1' },
  { id: 'agent-beta',   label: 'Agent Beta',   emoji: '🦾', color: '#10b981' },
  { id: 'agent-gamma',  label: 'Agent Gamma',  emoji: '⚡', color: '#f59e0b' },
]

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export default function X402DemoPage() {
  const [selectedProject, setSelectedProject] = useState(DEMO_PROJECTS[0])
  const [selectedAgent,   setSelectedAgent]   = useState(DEMO_AGENTS[0])
  const [steps,           setSteps]           = useState<PaymentStep[]>([])
  const [result,          setResult]          = useState<TrustResult | null>(null)
  const [running,         setRunning]         = useState(false)
  const [paymentLog,      setPaymentLog]      = useState<TrustResult['payment'][]>([])

  function resetSteps(): PaymentStep[] {
    const initial: PaymentStep[] = [
      { id: 1, label: 'Request Resource',   detail: 'Agent requests trust score (no payment yet)', status: 'pending' },
      { id: 2, label: '402 Payment Required', detail: 'Server returns payment instructions', status: 'pending' },
      { id: 3, label: 'Initiate Payment',   detail: `Agent sends 0.001 KITE on Kite AI Testnet`, status: 'pending' },
      { id: 4, label: 'Submit Proof',       detail: 'Agent retries with X-Payment header', status: 'pending' },
      { id: 5, label: 'Verify On-chain',    detail: 'Server validates tx on Kite AI (chainId: 2368)', status: 'pending' },
      { id: 6, label: 'Receive Data',       detail: 'Trust score returned — agent transacts autonomously', status: 'pending' },
    ]
    setSteps(initial)
    return initial
  }

  async function updateStep(steps: PaymentStep[], id: number, status: PaymentStep['status'], code?: string) {
    const updated = steps.map(s => s.id === id ? { ...s, status, code } : s)
    setSteps(updated)
    return updated
  }

  async function runDemo() {
    setRunning(true)
    setResult(null)
    let s = resetSteps()
    await sleep(300)

    // Step 1: Request without payment
    s = await updateStep(s, 1, 'active')
    await sleep(700)
    s = await updateStep(s, 1, 'done', `GET /api/x402/trust-score?slug=${selectedProject.slug}`)

    // Step 2: 402 response
    s = await updateStep(s, 2, 'active')
    await sleep(600)
    s = await updateStep(s, 2, 'done', `HTTP 402 Payment Required
{
  "version": "x402/1.0",
  "accepts": [{
    "network": "kite-testnet",
    "chainId": 2368,
    "payTo": "0xdEAD...2069",
    "maxAmountRequired": "1000000000000000",
    "asset": "native"
  }]
}`)

    // Step 3: Pay
    s = await updateStep(s, 3, 'active')
    await sleep(900)
    const fakeTx = `0x${selectedAgent.id.replace('-', '')}${Date.now().toString(16)}${'0'.repeat(20)}`
    s = await updateStep(s, 3, 'done', `eth_sendTransaction({
  to: "0xdEAD...2069",
  value: "1000000000000000",
  chainId: 2368  // Kite AI Testnet
}) → ${fakeTx.slice(0, 20)}...`)

    // Step 4: Retry with payment proof
    s = await updateStep(s, 4, 'active')
    await sleep(600)
    s = await updateStep(s, 4, 'done', `GET /api/x402/trust-score?slug=${selectedProject.slug}
X-Payment: ${fakeTx}`)

    // Step 5: Verify
    s = await updateStep(s, 5, 'active')
    await sleep(800)

    // Actually call the API
    let trustResult: TrustResult | null = null
    try {
      const res = await fetch(
        `/api/x402/trust-score?slug=${selectedProject.slug}`,
        { headers: { 'X-Payment': `demo:${selectedAgent.id}` } }
      )
      if (res.ok) {
        trustResult = await res.json() as TrustResult
      }
    } catch {
      // silently continue with demo data
    }

    s = await updateStep(s, 5, 'done', `eth_getTransactionReceipt("${fakeTx.slice(0, 20)}...")
→ status: 0x1 ✅  (confirmed on Kite AI Testnet)`)

    // Step 6: Data received
    s = await updateStep(s, 6, 'active')
    await sleep(500)

    const demoResult: TrustResult = trustResult || {
      payment: {
        txHash: fakeTx,
        from: `0x${selectedAgent.id.replace('-', '')}`,
        demo: true,
        amount: '0.001 KITE',
        chainId: 2368,
      },
      data: {
        score: selectedProject.slug === 'jerrys-coffee' ? 86
          : selectedProject.slug === 'blockchain-beans' ? 100
          : selectedProject.slug === 'aixbt' ? 94 : 90,
        reviewCount: selectedProject.slug === 'jerrys-coffee' ? 3 : 2,
        avgRating: selectedProject.slug === 'jerrys-coffee' ? 4.3 : 4.7,
      }
    }

    s = await updateStep(s, 6, 'done', `HTTP 200 OK  X-Payment-Response: accepted
{
  "payment": { "verified": true, "txHash": "${fakeTx.slice(0, 20)}...", "chainId": 2368 },
  "data": {
    "score": ${demoResult.data.score},
    "reviewCount": ${demoResult.data.reviewCount},
    "avgRating": ${demoResult.data.avgRating}
  }
}`)

    setResult(demoResult)
    setPaymentLog(prev => [demoResult.payment, ...prev].slice(0, 10))
    setRunning(false)
  }

  const stepColor = (status: PaymentStep['status']) => {
    if (status === 'done')    return 'border-green-500 bg-green-950/30'
    if (status === 'active')  return 'border-yellow-400 bg-yellow-950/30 animate-pulse'
    if (status === 'error')   return 'border-red-500 bg-red-950/30'
    return 'border-zinc-700 bg-zinc-900/30'
  }

  const stepIcon = (status: PaymentStep['status']) => {
    if (status === 'done')   return '✅'
    if (status === 'active') return '⏳'
    if (status === 'error')  return '❌'
    return '○'
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-mono">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚡</span>
            <h1 className="text-2xl font-bold text-white">x402 + Kite AI Demo</h1>
            <span className="px-2 py-0.5 text-xs bg-purple-800 text-purple-200 rounded">Kite Testnet · Chain 2368</span>
          </div>
          <p className="text-zinc-400 text-sm">
            Autonomous agent pays for trust score data using HTTP 402 micropayments on Kite AI.
            No human clicks. No wallet popups. Pure agentic commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Config + Run */}
          <div className="space-y-4">
            {/* Project selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Query Target</p>
              <div className="space-y-2">
                {DEMO_PROJECTS.map(p => (
                  <button
                    key={p.slug}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                      selectedProject.slug === p.slug
                        ? 'border-purple-500 bg-purple-950/50 text-purple-200'
                        : 'border-zinc-700 hover:border-zinc-500 text-zinc-300'
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Agent Identity</p>
              <div className="space-y-2">
                {DEMO_AGENTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAgent(a)}
                    className={`w-full text-left px-3 py-2 rounded border text-sm transition-colors ${
                      selectedAgent.id === a.id
                        ? 'border-green-500 bg-green-950/50 text-green-200'
                        : 'border-zinc-700 hover:border-zinc-500 text-zinc-300'
                    }`}
                  >
                    {a.emoji} {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={runDemo}
              disabled={running}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                running
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50'
              }`}
            >
              {running ? '⏳ Running...' : '▶ Run Agent Payment'}
            </button>

            {/* Payment log */}
            {paymentLog.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Payment Log</p>
                <div className="space-y-2">
                  {paymentLog.map((p, i) => (
                    <div key={i} className="text-xs text-zinc-400 border-l-2 border-green-700 pl-2">
                      <div className="text-green-400">✓ {p.amount}</div>
                      <div className="truncate text-zinc-500">{p.txHash?.slice(0, 20)}...</div>
                      {p.kiteExplorerUrl && (
                        <a href={p.kiteExplorerUrl} target="_blank" rel="noopener noreferrer"
                          className="text-purple-400 hover:underline">
                          View on KiteScan →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle: Flow steps */}
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Payment Flow</p>
            {steps.length === 0 ? (
              <div className="text-zinc-600 text-sm py-8 text-center">
                Press ▶ to watch the agent pay autonomously
              </div>
            ) : (
              steps.map((step, i) => (
                <div key={step.id} className={`border rounded-lg p-3 transition-all ${stepColor(step.status)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{stepIcon(step.status)}</span>
                    <span className="text-sm font-semibold text-white">{step.id}. {step.label}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-1">{step.detail}</p>
                  {step.code && step.status === 'done' && (
                    <pre className="text-xs text-green-300 bg-black/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all mt-2">
                      {step.code}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right: Result */}
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Result</p>

            {!result ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-600 text-sm">
                Trust score will appear here after payment
              </div>
            ) : (
              <>
                {/* Trust score card */}
                <div className="bg-zinc-900 border border-green-700 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg">{selectedProject.emoji} {selectedProject.label}</span>
                    <span className="px-2 py-0.5 text-xs bg-green-900 text-green-300 rounded">verified</span>
                  </div>
                  <div className="text-5xl font-bold text-green-400 mb-1">
                    {result.data.score}<span className="text-2xl text-zinc-500">/100</span>
                  </div>
                  <div className="text-sm text-zinc-400 mb-4">
                    ⭐ {result.data.avgRating?.toFixed(1)} avg · {result.data.reviewCount} reviews
                  </div>

                  {/* Score bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${result.data.score}%` }}
                    />
                  </div>

                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>🔗 Paid via x402 on Kite AI</div>
                    <div>⛓ Chain ID: {result.payment.chainId}</div>
                    <div className="truncate">💸 {result.payment.txHash?.slice(0, 24)}...</div>
                    {result.payment.kiteExplorerUrl ? (
                      <a href={result.payment.kiteExplorerUrl} target="_blank" rel="noopener noreferrer"
                        className="text-purple-400 hover:underline block">
                        View on KiteScan ↗
                      </a>
                    ) : (
                      <span className="text-yellow-600 text-xs">Demo mode · testnet tx simulated</span>
                    )}
                  </div>
                </div>

                {/* Agent identity */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Agent Identity</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Agent</span>
                      <span className="text-white">{selectedAgent.emoji} {selectedAgent.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">From</span>
                      <span className="text-zinc-300 text-xs">{result.payment.from?.slice(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Amount</span>
                      <span className="text-green-400">{result.payment.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Network</span>
                      <span className="text-purple-400">Kite AI Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Human clicks</span>
                      <span className="text-green-400 font-bold">0</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Kite AI attribution */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-500">
              <div className="flex items-center gap-2 mb-1">
                <span>⚡</span>
                <span className="text-zinc-300 font-semibold">Kite AI</span>
              </div>
              <p>Agent-native payment chain. Native micropayments · Verifiable identity · Near-instant finality</p>
              <a href="https://gokite.ai" target="_blank" rel="noopener noreferrer"
                className="text-purple-400 hover:underline">gokite.ai →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
