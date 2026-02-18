/**
 * AI Review Quality Analysis
 * Uses Gemini to evaluate review quality before storing.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

interface ReviewAnalysis {
  quality: 'high' | 'medium' | 'low' | 'spam'
  score: number // 0-100
  reason: string
  isUseful: boolean
}

export async function analyzeReview(
  projectName: string,
  rating: number,
  content: string
): Promise<ReviewAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are a review quality analyzer for Maiat, a crypto project trust score platform.

Analyze this review and rate its quality. Be strict but fair.

Project: ${projectName}
Rating: ${rating}/5
Review: "${content}"

Evaluate based on:
1. Specificity — Does it mention specific features, experiences, or details?
2. Relevance — Is it about the actual project?
3. Usefulness — Would this help someone decide whether to use this project?
4. Authenticity — Does it seem like a genuine user experience (not AI-generated fluff)?

Respond in JSON only:
{
  "quality": "high" | "medium" | "low" | "spam",
  "score": 0-100,
  "reason": "one sentence explanation",
  "isUseful": true/false
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ReviewAnalysis
    }

    // Fallback
    return { quality: 'medium', score: 50, reason: 'Could not analyze', isUseful: true }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    // On error, allow the review through
    return { quality: 'medium', score: 50, reason: 'Analysis unavailable', isUseful: true }
  }
}
