import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const competitionId = parseInt(id)

    if (isNaN(competitionId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        category: true,
        field: true,
        creator: {
          select: { id: true, name: true, photo: true, role: true }
        },
        stages: {
          orderBy: { stageNumber: 'asc' }
        },
        _count: {
          select: {
            participations: true,
            teams: true,
          }
        }
      },
    })

    if (!competition) {
      return NextResponse.json(
        { error: 'Kompetisi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.competition.update({
      where: { id: competitionId },
      data: { viewCount: { increment: 1 } },
    })

    // Calculate days remaining
    const now = new Date()
    const deadline = new Date(competition.deadline)
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      ...competition,
      stats: {
        participations: competition._count.participations,
        teams: competition._count.teams,
      },
      daysRemaining,
      _count: undefined,
    })
  } catch (error) {
    console.error('GET /api/competitions/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat detail kompetisi' },
      { status: 500 }
    )
  }
}
