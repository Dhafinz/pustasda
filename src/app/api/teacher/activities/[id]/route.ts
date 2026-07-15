import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const activityId = parseInt(id)
    const teacherId = parseInt(session.user.id)
    const { status, teacherNotes } = await request.json() // status: 'approved' | 'rejected'

    if (isNaN(activityId) || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const activity = await prisma.mentorshipActivity.findUnique({
      where: { id: activityId },
      include: {
        mentorship: {
          include: {
            participation: {
              select: { userId: true }
            }
          }
        }
      }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Aktivitas tidak ditemukan' }, { status: 404 })
    }

    if (activity.mentorship.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await prisma.mentorshipActivity.update({
      where: { id: activityId },
      data: {
        status,
        teacherNotes: teacherNotes !== undefined ? teacherNotes : activity.teacherNotes
      }
    })

    // Notify student about activity approval/notes
    await prisma.notification.create({
      data: {
        userId: activity.mentorship.participation.userId,
        type: 'activity_response',
        title: `Progres Bimbingan ${status === 'approved' ? 'Disetujui' : 'Diupdate'}`,
        body: `Pembimbing telah meninjau aktivitas "${activity.title}". Status: ${status === 'approved' ? 'Disetujui' : 'Butuh Revisi'}`,
        icon: status === 'approved' ? 'fa-check' : 'fa-triangle-exclamation',
        color: status === 'approved' ? '#22c55e' : '#f5a623'
      }
    })

    return NextResponse.json({
      message: 'Aktivitas berhasil diperbarui',
      activity: updated
    })
  } catch (error) {
    console.error('PATCH /api/teacher/activities/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui aktivitas' }, { status: 500 })
  }
}
