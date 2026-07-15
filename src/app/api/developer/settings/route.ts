import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'developer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
    }

    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: 'appearance' }
    })

    return NextResponse.json({
      message: `Setting ${key} updated successfully`,
      setting
    })
  } catch (error) {
    console.error('POST /api/developer/settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
