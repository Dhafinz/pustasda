import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// POST: Confirm/update a participation step
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
    const { stepOrder, isConfirmed, notes } = await request.json()

    if (isNaN(participationId) || typeof stepOrder !== 'number') {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: { team: true }
    })

    if (!participation) {
      return NextResponse.json({ error: 'Partisipasi tidak ditemukan' }, { status: 404 })
    }

    // Only participant or team leader can confirm steps
    const isOwner = participation.userId === userId
    const isLeader = participation.team?.leaderId === userId
    
    // If team exists, only team leader can confirm steps
    if (participation.team && participation.team.leaderId !== userId) {
      return NextResponse.json({ error: 'Hanya ketua tim yang dapat mengubah progres lomba' }, { status: 403 })
    }

    if (!isOwner && !isLeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update the specific step
    const step = await prisma.participationStep.findFirst({
      where: { participationId, stepOrder }
    })

    if (!step) {
      return NextResponse.json({ error: 'Langkah tidak ditemukan' }, { status: 404 })
    }

    const updatedStep = await prisma.participationStep.update({
      where: { id: step.id },
      data: {
        isConfirmed,
        confirmedAt: isConfirmed ? new Date() : null,
        notes: notes || step.notes
      }
    })

    // If the step being confirmed is step 2 (Pengerjaan), update participation status to 'in_progress'
    if (stepOrder === 2 && isConfirmed) {
      await prisma.participation.update({
        where: { id: participationId },
        data: { status: 'in_progress' }
      })
    }

    // Sync steps and status to other team members
    if (participation.teamId) {
      const siblingParticipations = await prisma.participation.findMany({
        where: {
          teamId: participation.teamId,
          id: { not: participationId }
        }
      })
      
      for (const sib of siblingParticipations) {
        const stepExists = await prisma.participationStep.findFirst({
          where: { participationId: sib.id, stepOrder }
        })
        
        if (stepExists) {
          await prisma.participationStep.update({
            where: { id: stepExists.id },
            data: {
              isConfirmed,
              confirmedAt: isConfirmed ? new Date() : null,
              notes: notes || step.notes
            }
          })
        } else {
          await prisma.participationStep.create({
            data: {
              participationId: sib.id,
              stepOrder,
              stepName: step.stepName,
              isConfirmed,
              confirmedAt: isConfirmed ? new Date() : null,
              notes: notes || ''
            }
          })
        }

        if (stepOrder === 2 && isConfirmed) {
          await prisma.participation.update({
            where: { id: sib.id },
            data: { status: 'in_progress' }
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Langkah partisipasi berhasil diperbarui',
      step: updatedStep
    })
  } catch (error) {
    console.error('POST /api/participations/[id]/step error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui langkah' }, { status: 500 })
  }
}
