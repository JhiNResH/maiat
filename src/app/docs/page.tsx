import Link from 'next/link'

export const metadata = {
  title: 'API Docs — Maiat',
  description: 'Trust Score API documentation for AI agents and developers',
}

const endpoints = [
  {
    method: 'GET',
    path: '/api/trust-score?project={name}',
    description: 'Query trust score for any project. Primary endpoint for AI agents to assess trustworthiness before transacting.',
    params: [
      { name: 'project', type: 'string', required: true, description: 'Project name or contract address' },
    ],
    response: `{
  "name": "AIXBT",
  "address": "0x4f9...",
  "category": "m/ai-agents",
  "trustScore": 82,
  "avgRating": 4.1,
  "reviewCount": 12,
  "risk": "low",
  "latestReviews": [...],
  "callbackUrl": "https://maiat.xyz/api/reviews",
  "botLink": "https://t.me/MaiatBot"
}`,
    example: 'curl https://maiat.xyz/api/trust-score?project=AIXBT',
  },
  {
    method: 'GET',
    path: '/api/reviews?projectId={id}',
    description: 'Fetch all reviews for a project. Returns on-chain anchored reviews with verification status.',
    params: [
      { name: 'projectId', type: 'string', required: true, description: 'Project ID' },
    ],
    response: `{
  "reviews": [
    {
      "id": "clx...",
      "rating": 4,
      "content": "Reliable AI agent...",
      "txHash": "0xabc...",
      "reviewer": { "displayName": "0x872..." }
    }
  ]
}`,
    example: 'curl https://maiat.xyz/api/reviews?projectId=clx123',
  },
  {
    method: 'POST',
    path: '/api/reviews',
    description: 'Submit a new review. Requires wallet authentication via Privy. Reviews are anchored on-chain via BSC ReviewRegistry.',
    params: [
      { name: 'projectId', type: 'string', required: true, description: 'Project ID to review' },
      { name: 'rating', type: 'number', required: true, description: 'Rating 1-5' },
      { name: 'content', type: 'string', required: true, description: 'Review text' },
      { name: 'address', type: 'string', required: true, description: 'Reviewer wallet address' },
    ],
    response: `{ "review": { "id": "clx...", "rating": 4, "content": "..." } }`,
    example: `curl -X POST https://maiat.xyz/api/reviews \\
  -H "Content-Type: application/json" \\
  -d '{"projectId":"clx123","rating":4,"content":"Solid agent","address":"0x..."}'`,
  },
  {
    method: 'POST',
    path: '/api/verify-0g',
    description: 'Verify a review using 0G Compute Network decentralized AI inference (Qwen 2.5 7B with TeeML).',
    params: [
      { name: 'reviewContent', type: 'string', required: true, description: 'Review text to verify' },
      { name: 'projectName', type: 'string', required: true, description: 'Project being reviewed' },
    ],
    response: `{
  "verified": true,
  "score": 85,
  "analysis": "Review appears genuine...",
  "requestId": "maiat-review-1708..."
}`,
    example: `curl -X POST https://maiat.xyz/api/verify-0g \\
  -d '{"reviewContent":"Great agent...","projectName":"AIXBT"}'`,
  },
  {
    method: 'POST',
    path: '/api/verify-kite',
    description: 'Verify via Kite AI x402 micropayment protocol. Agent pays 0.001 KITE per verification — HTTP 402 Payment Required flow.',
    params: [
      { name: 'reviewId', type: 'string', required: true, description: 'Review ID to verify' },
    ],
    response: `{
  "verified": true,
  "paymentTx": "0xdef...",
  "cost": "0.001 KITE"
}`,
    example: `curl -X POST https://maiat.xyz/api/verify-kite \\
  -d '{"reviewId":"clx456"}'`,
  },
  {
    method: 'GET',
    path: '/api/leaderboard',
    description: 'Get top reviewers ranked by reputation score and Scarab earnings.',
    params: [],
    response: `{
  "leaderboard": [
    { "address": "0x872...", "reputationScore": 150, "totalReviews": 23 }
  ]
}`,
    example: 'curl https://maiat.xyz/api/leaderboard',
  },
  {
    method: 'GET',
    path: '/api/scarab?address={wallet}',
    description: 'Query Scarab point balance for a wallet. Scarab is the off-chain reputation currency.',
    params: [
      { name: 'address', type: 'string', required: true, description: 'Wallet address' },
    ],
    response: `{
  "address": "0x872...",
  "balance": 250,
  "totalEarned": 400,
  "streak": 5
}`,
    example: 'curl https://maiat.xyz/api/scarab?address=0x872...',
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <header className="bg-white dark:bg-[#1a1b23] border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-light.png" alt="MAIAT" className="w-7 h-7 block dark:hidden" /><img src="/logo-light.png" alt="MAIAT" className="w-7 h-7 hidden dark:block" />
            <span className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100">MAIAT</span>
            <span className="text-xs font-mono text-gray-400 ml-2">/ docs</span>
          </Link>
          <a href="https://t.me/MaiatBot" className="text-xs font-mono text-blue-600 hover:underline">@MaiatBot</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-100 mb-3">Trust Score API</h1>
          <p className="text-sm font-mono text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
            Query trust scores before your agent transacts. Maiat aggregates human reviews, AI verification, 
            and on-chain reputation into a single score. No API key required for read endpoints.
          </p>
          <div className="mt-4 flex gap-3">
            <span className="px-2 py-1 text-xs font-mono bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Base URL: https://maiat.xyz</span>
            <span className="px-2 py-1 text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">BSC Testnet</span>
            <span className="px-2 py-1 text-xs font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">Kite AI Testnet</span>
          </div>
        </div>

        {/* Architecture */}
        <div className="mb-10 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">How It Works</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { step: '1', title: 'Agent queries', desc: 'GET /api/trust-score' },
              { step: '2', title: 'Score returned', desc: 'Aggregated from reviews + AI' },
              { step: '3', title: 'Agent decides', desc: 'Transact or avoid' },
              { step: '4', title: 'Post-tx review', desc: 'POST /api/reviews' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold font-mono mb-2">{s.step}</div>
                <div className="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">{s.title}</div>
                <div className="text-[10px] font-mono text-gray-400 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* On-chain */}
        <div className="mb-10 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">On-Chain Contracts</h2>
          <table className="w-full text-xs font-mono">
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 text-gray-500">ReviewRegistry</td>
                <td className="py-2"><a href="https://testnet.bscscan.com/address/0x9453A6EA1BB1Acd31F2288971DBda8e4088EFF37" className="text-blue-600 hover:underline">0x9453...EFF37</a></td>
                <td className="py-2 text-gray-400">BSC Testnet (97)</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Kite AI RPC</td>
                <td className="py-2 text-gray-300">rpc-testnet.gokite.ai</td>
                <td className="py-2 text-gray-400">Chain 2368</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Endpoints */}
        <h2 className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Endpoints</h2>
        <div className="space-y-6">
          {endpoints.map((ep, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${
                  ep.method === 'GET' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                }`}>{ep.method}</span>
                <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{ep.path}</code>
              </div>
              <div className="px-5 py-3">
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-3">{ep.description}</p>
                
                {ep.params.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] font-bold font-mono text-gray-400 uppercase mb-1">Parameters</div>
                    <table className="w-full text-xs font-mono">
                      <tbody>
                        {ep.params.map(p => (
                          <tr key={p.name} className="border-t border-gray-50 dark:border-gray-800">
                            <td className="py-1.5 text-gray-900 dark:text-gray-100 w-28">{p.name}</td>
                            <td className="py-1.5 text-gray-400 w-20">{p.type}</td>
                            <td className="py-1.5">{p.required && <span className="text-red-500 text-[10px]">required</span>}</td>
                            <td className="py-1.5 text-gray-500">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mb-3">
                  <div className="text-[10px] font-bold font-mono text-gray-400 uppercase mb-1">Example</div>
                  <pre className="bg-gray-900 dark:bg-black text-green-400 text-xs p-3 rounded overflow-x-auto font-mono">{ep.example}</pre>
                </div>

                <div>
                  <div className="text-[10px] font-bold font-mono text-gray-400 uppercase mb-1">Response</div>
                  <pre className="bg-gray-50 dark:bg-[#0f1117] text-gray-700 dark:text-gray-300 text-xs p-3 rounded overflow-x-auto font-mono border border-gray-200 dark:border-gray-700">{ep.response}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Guide */}
        <div className="mt-10 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">Quick Integration (3 lines)</h2>
          <pre className="bg-gray-900 dark:bg-black text-green-400 text-xs p-4 rounded overflow-x-auto font-mono">{`// Before your agent transacts with any protocol:
const res = await fetch('https://maiat.xyz/api/trust-score?project=AIXBT');
const { trustScore, risk } = await res.json();
if (risk === 'high') throw new Error('Maiat: untrusted protocol');`}</pre>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs font-mono text-gray-400 pb-8">
          <p>Maiat — Trust Layer for Agentic Commerce</p>
          <p className="mt-1">
            <a href="https://t.me/MaiatBot" className="text-blue-600 hover:underline">Telegram Bot</a>
            {' · '}
            <a href="https://github.com/JhiNResH/maiat" className="text-blue-600 hover:underline">GitHub</a>
            {' · '}
            <Link href="/" className="text-blue-600 hover:underline">Dashboard</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
