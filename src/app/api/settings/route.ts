import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany({
      where: { key: { in: ['primary_color', 'app_icon'] } }
    })
    const primaryColor = settings.find(s => s.key === 'primary_color')?.value || '#e31e25'
    const appIcon = settings.find(s => s.key === 'app_icon')?.value || ''
    
    return NextResponse.json({ primary_color: primaryColor, app_icon: appIcon })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}
