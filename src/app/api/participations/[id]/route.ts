import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
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

    if (isNaN(participationId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // Fetch participation
    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        competition: {
          include: {
            category: true,
            field: true,
            stages: {
              orderBy: { stageNumber: 'asc' }
            }
          }
        },
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, photo: true, email: true }
                }
              }
            },
            leader: {
              select: { id: true, name: true, photo: true }
            }
          }
        },
        steps: {
          orderBy: { stepOrder: 'asc' }
        },
        mentorship: {
          include: {
            teacher: {
              select: { id: true, name: true, photo: true, waNumber: true }
            },
            activities: {
              orderBy: { scheduleDate: 'desc' }
            }
          }
        }
      }
    })

    if (!participation) {
      return NextResponse.json({ error: 'Partisipasi tidak ditemukan' }, { status: 404 })
    }

    // Verify ownership (or if user is part of the same team)
    const isOwner = participation.userId === userId
    let isTeamMember = false
    if (participation.teamId) {
      isTeamMember = participation.team?.members.some((m) => m.userId === userId) || false
    }

    if (!isOwner && !isTeamMember && session.user.role !== 'admin' && session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count days remaining
    const now = new Date()
    const deadline = new Date(participation.competition.deadline)
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      ...participation,
      daysRemaining
    })
  } catch (error) {
    console.error('GET /api/participations/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memuat detail partisipasi' }, { status: 500 })
  }
}

// PATCH: Update status (confirm submission, complete competition, or declare failure)
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
    const participationId = parseInt(id)
    const userId = parseInt(session.user.id)
    const body = await request.json()
    const { action, result, notes } = body // action: 'submit' | 'complete' | 'fail' | 'update_role'

    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        competition: true,
        team: true
      }
    })

    if (!participation) {
      return NextResponse.json({ error: 'Partisipasi tidak ditemukan' }, { status: 404 })
    }

    // Only allow owner or team leader to change status
    const isOwner = participation.userId === userId
    const isLeader = participation.team?.leaderId === userId
    if (participation.teamId) {
      if (!isLeader) {
        return NextResponse.json({ error: 'Hanya ketua tim yang dapat mengubah status kelompok ini' }, { status: 401 })
      }
    } else {
      if (!isOwner) {
        return NextResponse.json({ error: 'Hanya pemilik partisipasi yang dapat mengubah data ini' }, { status: 401 })
      }
    }

    let updatedStatus = participation.status
    let updatedResult = participation.result
    let updatedNotes = participation.notes

    let targetIds = [participationId]
    if (participation.teamId) {
      const siblings = await prisma.participation.findMany({
        where: { teamId: participation.teamId },
        select: { id: true }
      })
      targetIds = siblings.map(s => s.id)
    }

    if (action === 'submit') {
      // Confirms submission, moves status to 'submitted'
      updatedStatus = 'submitted'
      if (notes !== undefined) {
        updatedNotes = notes
      }
      // Auto-confirm the third step (Submit Karya) for all team members
      await prisma.participationStep.updateMany({
        where: { participationId: { in: targetIds }, stepOrder: 3 },
        data: { isConfirmed: true, confirmedAt: new Date(), notes: notes || 'Karya berhasil dikirim' }
      })
    } else if (action === 'complete') {
      // Complete competition, student submits proof of award/announcement
      updatedStatus = 'completed'
      updatedResult = result || 'belum_diisi'
      if (notes !== undefined) {
        updatedNotes = notes
      }
      // Auto-confirm the fourth step (Pengumuman) for all team members
      await prisma.participationStep.updateMany({
        where: { participationId: { in: targetIds }, stepOrder: 4 },
        data: { isConfirmed: true, confirmedAt: new Date(), notes: notes || 'Pengumuman dikonfirmasi' }
      })
    } else if (action === 'fail') {
      // Confirm failure to submit (not_submitted)
      updatedStatus = 'not_submitted'
      updatedResult = 'tidak_lolos'
    }

    await prisma.participation.updateMany({
      where: { id: { in: targetIds } },
      data: {
        status: updatedStatus,
        result: updatedResult,
        notes: updatedNotes
      }
    })

    const updatedParticipation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        }
      }
    })

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: `participation_${action}`,
        module: 'participation',
        description: `Action: ${action} for competition ${participation.competition.title}. Status updated to ${updatedStatus}.`
      }
    })

    return NextResponse.json({
      message: 'Status partisipasi berhasil diperbarui',
      participation: updatedParticipation
    })
  } catch (error) {
    console.error('PATCH /api/participations/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui partisipasi' }, { status: 500 })
  }
}
