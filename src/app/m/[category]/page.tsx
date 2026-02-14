export default function CategoryPage({
  params,
}: {
  params: { category: string }
}) {
  const categoryNames: Record<string, string> = {
    'openclaw-skills': 'OpenClaw Skills',
    'ai-agents': 'AI Agents',
    'memecoin': 'Memecoins',
    'defi': 'DeFi Protocols',
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          m/{params.category}
        </h1>
        <p className="text-maat-text-secondary mb-8">
          {categoryNames[params.category] || params.category}
        </p>
        
        <div className="border border-maat-border rounded-lg p-8 text-center">
          <p className="text-maat-text-muted">
            Category page scaffold - UI to be built
          </p>
          <p className="text-sm text-maat-text-muted mt-2">
            Will display projects, reviews, and leaderboard for this category
          </p>
        </div>
      </div>
    </main>
  )
}
