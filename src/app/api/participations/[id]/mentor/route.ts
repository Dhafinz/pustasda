import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// POST: Request a teacher to become a mentor
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
    const { teacherId } = await request.json()

    if (isNaN(participationId) || !teacherId) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        competition: true,
        team: true,
        mentorship: true
      }
    })

    if (!participation) {
      return NextResponse.json({ error: 'Partisipasi tidak ditemukan' }, { status: 404 })
    }

    // Only participant or team leader can request mentorship
    const isOwner = participation.userId === userId
    const isLeader = participation.team?.leaderId === userId
    if (!isOwner && !isLeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if mentorship already exists
    if (participation.mentorship) {
      if (participation.mentorship.status === 'accepted') {
        return NextResponse.json({ error: 'Mentorship sudah disetujui sebelumnya' }, { status: 400 })
      }
      // If rejected or pending, we can update it or recreate it. Let's delete and recreate to keep it clean.
      await prisma.mentorship.delete({ where: { id: participation.mentorship.id } })
    }

    // Create mentorship request
    const mentorship = await prisma.mentorship.create({
      data: {
        participationId,
        teacherId: parseInt(teacherId),
        status: 'pending'
      }
    })

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: parseInt(teacherId),
        type: 'mentorship_request',
        title: 'Pengajuan Pembimbing Baru',
        body: `${session.user.name} mengajukan bimbingan kepada Anda untuk kompetisi "${participation.competition.title}"`,
        icon: 'fa-chalkboard-user',
        color: '#f5a623'
      }
    })

    return NextResponse.json({
      message: 'Permintaan bimbingan berhasil diajukan',
      mentorship
    })
  } catch (error) {
    console.error('POST /api/participations/[id]/mentor error:', error)
    return NextResponse.json({ error: 'Gagal mengajukan pembimbing' }, { status: 500 })
  }
}
