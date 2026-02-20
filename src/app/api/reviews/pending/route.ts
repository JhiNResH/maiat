/**
 * GET /api/reviews/pending
 *
 * Returns pending (unverified) reviews for Chainlink CRE workflow consumption.
 * The CRE trust-score-oracle workflow calls this endpoint every 5 minutes
 * to fetch reviews that need AI verification.
 *
 * Used by: Chainlink CRE & AI track (Convergence hackathon)
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Fetch reviews that haven't been CRE-verified yet
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, project_id, content, rating, author_address, created_at")
      .eq("cre_verified", false)
      .order("created_at", { ascending: true })
      .limit(50)

    if (error) {
      console.error("Error fetching pending reviews:", error)
      // Return empty set rather than error — CRE workflow needs valid JSON
      return NextResponse.json({ reviews: [], count: 0 })
    }

    const formattedReviews = (reviews || []).map((r) => ({
      id: r.id,
      projectId: r.project_id,
      content: r.content,
      rating: r.rating,
      authorAddress: r.author_address,
      createdAt: r.created_at,
    }))

    return NextResponse.json({
      reviews: formattedReviews,
      count: formattedReviews.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("Pending reviews API error:", err)
    return NextResponse.json({ reviews: [], count: 0 })
  }
}
