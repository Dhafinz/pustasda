import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

export async function POST(req: Request) {
  const results: Record<string, unknown> = {}
  
  try {
    const body = await req.json()
    results.step1_body = { email: body.email, passwordLength: body.password?.length }

    // Step 2: Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, email: true, name: true, role: true, isActive: true, password: true }
    })
    results.step2_userFound = !!user
    results.step2_userDetails = user ? { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive, hashPrefix: user.password?.substring(0, 20) } : null

    if (!user) {
      return NextResponse.json({ ...results, finalResult: 'USER_NOT_FOUND' })
    }

    // Step 3: Compare password
    const isValid = await compare(body.password, user.password)
    results.step3_passwordValid = isValid

    if (!isValid) {
      return NextResponse.json({ ...results, finalResult: 'INVALID_PASSWORD' })
    }

    // Step 4: Try creating activity log (like authorize does)
    try {
      await prisma.activityLog.create({
        data: { userId: user.id, action: 'test_login', module: 'debug', description: 'Test login simulation' }
      })
      results.step4_activityLog = 'SUCCESS'
    } catch (e: any) {
      results.step4_activityLog = `FAILED: ${e.message}`
    }

    return NextResponse.json({ ...results, finalResult: 'LOGIN_WOULD_SUCCEED' })
  } catch (e: any) {
    return NextResponse.json({ ...results, error: e.message, stack: e.stack?.substring(0, 500) }, { status: 500 })
  }
}
