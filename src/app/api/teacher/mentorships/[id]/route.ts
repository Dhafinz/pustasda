import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// PATCH: Approve or Reject mentorship request
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
    const mentorshipId = parseInt(id)
    const teacherId = parseInt(session.user.id)
    const { status } = await request.json() // 'accepted' or 'rejected'

    if (isNaN(mentorshipId) || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      include: {
        participation: {
          include: {
            user: { select: { id: true, name: true } },
            competition: { select: { title: true } }
          }
        }
      }
    })

    if (!mentorship) {
      return NextResponse.json({ error: 'Bimbingan tidak ditemukan' }, { status: 404 })
    }

    if (mentorship.teacherId !== teacherId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await prisma.mentorship.update({
      where: { id: mentorshipId },
      data: {
        status,
        respondedAt: new Date()
      }
    })

    // Notify student
    await prisma.notification.create({
      data: {
        userId: mentorship.participation.userId,
        type: 'mentorship_response',
        title: status === 'accepted' ? 'Bimbingan Disetujui' : 'Bimbingan Ditolak',
        body: `Guru ${session.user.name} telah ${status === 'accepted' ? 'menyetujui' : 'menolak'} pengajuan pembimbing untuk kompetisi "${mentorship.participation.competition.title}"`,
        icon: status === 'accepted' ? 'fa-circle-check' : 'fa-circle-xmark',
        color: status === 'accepted' ? '#22c55e' : '#e31e25'
      }
    })

    // Log Activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: teacherId,
          action: `mentorship_${status}`,
          module: 'mentorship',
          description: `Mentorship ID ${mentorshipId} ${status} for student ${mentorship.participation.user.name}`
        }
      })
    } catch (e) {
      console.error('Failed to write activity log:', e)
    }

    return NextResponse.json({
      message: `Pengajuan bimbingan berhasil ${status === 'accepted' ? 'diterima' : 'ditolak'}`,
      mentorship: updated
    })
  } catch (error) {
    console.error('PATCH /api/teacher/mentorships/[id] error:', error)
    return NextResponse.json({ error: 'Gagal merespon bimbingan' }, { status: 500 })
  }
}
