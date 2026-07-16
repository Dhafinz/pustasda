import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: { email: true, role: true }
    })
    return NextResponse.json({
      status: 'success',
      provider: 'postgresql',
      userCount,
      sampleUsers,
      databaseUrlConfigured: !!process.env.DATABASE_URL,
      nextauthSecretConfigured: !!process.env.AUTH_SECRET,
      nextauthUrlConfigured: !!process.env.NEXTAUTH_URL
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
