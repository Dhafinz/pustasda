import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const notificationId = parseInt(id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() }
    })

    return NextResponse.json({ message: 'Notification marked as read', notification: updated })
  } catch (error) {
    console.error('PATCH /api/notifications/[id]/read error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
