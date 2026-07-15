import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// POST: Add mentorship activity (timeline)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const participationId = parseInt(id)
    const userId = parseInt(session.user.id)
    const { title, description, scheduleDate, progress, documentUrl, location } = await request.json()

    if (isNaN(participationId) || !title) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        team: true,
        mentorship: true
      }
    })

    if (!participation) {
      return NextResponse.json({ error: 'Partisipasi tidak ditemukan' }, { status: 404 })
    }

    if (!participation.mentorship) {
      return NextResponse.json({ error: 'Bimbingan belum diaktifkan' }, { status: 400 })
    }

    // Verify user is owner, team leader, or the assigned teacher
    const isTeacher = participation.mentorship.teacherId === userId

    if (!isTeacher) {
      const isLeader = participation.team?.leaderId === userId
      const isOwner = participation.userId === userId && !participation.teamId
      
      if (!isLeader && !isOwner) {
        return NextResponse.json({ error: 'Hanya ketua tim yang dapat menambahkan aktivitas bimbingan' }, { status: 403 })
      }
    }

    // Construct the timeline activity title/description with custom output/progress if given
    // Let's create the mentorship activity
    const activity = await prisma.mentorshipActivity.create({
      data: {
        mentorshipId: participation.mentorship.id,
        title,
        description: description || '',
        scheduleDate: scheduleDate ? new Date(scheduleDate) : new Date(),
        status: isTeacher ? 'approved' : 'pending', // auto-approve if created by teacher
        teacherNotes: isTeacher ? 'Ditambahkan oleh pembimbing' : `Ditambahkan oleh ${session.user.name}`,
        documentUrl: documentUrl || null,
        location: location || 'Offline / Sekolah'
      }
    })

    return NextResponse.json({
      message: 'Aktivitas berhasil ditambahkan ke timeline',
      activity
    })
  } catch (error) {
    console.error('POST /api/participations/[id]/activity error:', error)
    return NextResponse.json({ error: 'Gagal menambahkan aktivitas' }, { status: 500 })
  }
}
