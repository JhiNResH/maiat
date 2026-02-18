/**
 * Maiat Trust Score Algorithm
 * 
 * Phase 1 (0 reviews): AI baseline from project fundamentals
 * Phase 2 (1-5 reviews): AI 60% + Community 40%
 * Phase 3 (6-20 reviews): AI 30% + Community 70%  
 * Phase 4 (20+ reviews): AI 10% + Community 90%
 */

const KNOWN_SCORES: Record<string, number> = {
  // Blue-chip DeFi
  'aave': 88, 'uniswap': 90, 'lido': 85, 'compound': 82, 'curve finance': 84,
  'pancakeswap': 80, 'ethena': 75, 'ether.fi': 78, 'morpho': 76, 'pendle': 74,
  'sky (makerdao)': 86,
  // Top AI Agents
  'aixbt': 82, 'g.a.m.e': 78, 'luna': 75, 'vaderai': 72, 'neurobro': 68,
  'billybets': 65, 'ethy ai': 70, 'music': 62, 'tracy.ai': 60, 'acolyt': 64,
  '1000x': 58, 'araistotle': 56, 'ribbita': 55, 'mamo': 60, 'freya protocol': 58,
}

export function getAIBaselineScore(name: string, category: string): number {
  return KNOWN_SCORES[name.toLowerCase()] ?? (category === 'm/defi' ? 60 : 50)
}

export function calculateTrustScore(
  name: string,
  category: string,
  avgRating: number,
  reviewCount: number
): number {
  const aiBaseline = getAIBaselineScore(name, category)
  
  if (reviewCount === 0) return aiBaseline
  
  const communityScore = Math.round(avgRating * 20)
  
  let aiWeight: number, communityWeight: number
  if (reviewCount <= 5) { aiWeight = 60; communityWeight = 40 }
  else if (reviewCount <= 20) { aiWeight = 30; communityWeight = 70 }
  else { aiWeight = 10; communityWeight = 90 }
  
  return Math.round((aiBaseline * aiWeight + communityScore * communityWeight) / 100)
}
