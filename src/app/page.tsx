export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Maat V2 🪲
        </h1>
        <p className="text-center text-maat-text-secondary mb-4">
          Trust Layer for Agentic Commerce
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
          <a
            href="/m/openclaw-skills"
            className="border border-maat-border p-4 rounded-lg hover:bg-maat-bg-secondary transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">m/openclaw-skills</h2>
            <p className="text-sm text-maat-text-muted">PRIMARY category for cold launch</p>
          </a>
          <a
            href="/m/ai-agents"
            className="border border-maat-border p-4 rounded-lg hover:bg-maat-bg-secondary transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">m/ai-agents</h2>
            <p className="text-sm text-maat-text-muted">AI agent reviews</p>
          </a>
          <a
            href="/m/memecoin"
            className="border border-maat-border p-4 rounded-lg hover:bg-maat-bg-secondary transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">m/memecoin</h2>
            <p className="text-sm text-maat-text-muted">Memecoin reviews</p>
          </a>
          <a
            href="/m/defi"
            className="border border-maat-border p-4 rounded-lg hover:bg-maat-bg-secondary transition-colors"
          >
            <h2 className="text-lg font-semibold mb-2">m/defi</h2>
            <p className="text-sm text-maat-text-muted">DeFi protocol reviews</p>
          </a>
        </div>
      </div>
    </main>
  )
}
