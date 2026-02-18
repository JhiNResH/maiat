import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const count = await prisma.project.count()
    return NextResponse.json({ 
      ok: true, 
      projects: count,
      dbUrl: process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@').slice(0, 80),
    })
  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      code: error.code,
      dbUrl: process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@').slice(0, 80),
    }, { status: 500 })
  }
}
