import { NextResponse } from 'next/server'
import { verifyReviewWith0G } from '@/lib/0g-compute'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, rating, category } = body

    if (!title || !content || !rating || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, rating, category' },
        { status: 400 }
      )
    }

    const result = await verifyReviewWith0G({ title, content, rating, category })

    return NextResponse.json({
      success: true,
      verification: result,
      timestamp: new Date().toISOString(),
      network: '0G Compute Testnet',
    })
  } catch (error: any) {
    console.error('0G verification error:', error)
    return NextResponse.json(
      { error: '0G verification failed', details: error.message },
      { status: 500 }
    )
  }
}
