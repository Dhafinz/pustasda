import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      take: 2,
      select: { email: true, role: true }
    })
    return NextResponse.json({
      status: 'success',
      userCount,
      users,
      env: {
        DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
        DIRECT_URL_length: process.env.DIRECT_URL?.length || 0,
        AUTH_SECRET_length: process.env.AUTH_SECRET?.length || 0,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || null,
        NODE_ENV: process.env.NODE_ENV
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 })
  }
}
