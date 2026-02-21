/**
 * x402 Payment Log
 * Returns recent agent payment activity for the demo dashboard.
 */

import { NextResponse } from 'next/server'
import { getPaymentLog } from '@/lib/x402'

export async function GET() {
  const log = getPaymentLog()
  return NextResponse.json({
    success: true,
    count: log.length,
    payments: log,
  })
}
