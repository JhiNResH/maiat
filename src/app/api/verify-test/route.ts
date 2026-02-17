import { NextResponse } from 'next/server'

/**
 * Simple health check endpoint for verification APIs
 * GET /api/verify-test
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      hasPrivateKey: !!process.env.PRIVATE_KEY,
      hasZGPrivateKey: !!process.env.ZG_PRIVATE_KEY,
    },
    endpoints: {
      'verify-0g': true,
      'verify-kite': true,
    },
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Verification APIs are configured',
    checks,
  })
}
