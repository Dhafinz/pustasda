import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET: List user's participations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''

    const where: any = { userId }
    if (status) where.status = status

    const participations = await prisma.participation.findMany({
      where,
      include: {
        competition: {
          include: {
            category: true,
            field: true,
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
              select: { id: true, name: true, photo: true }
            },
            activities: {
              orderBy: { scheduleDate: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Enrich with days remaining
    const enriched = participations.map(p => {
      const now = new Date()
      const deadline = new Date(p.competition.deadline)
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { ...p, daysRemaining }
    })

    return NextResponse.json({ participations: enriched })
  } catch (error) {
    console.error('GET /api/participations error:', error)
    return NextResponse.json({ error: 'Gagal memuat data partisipasi' }, { status: 500 })
  }
}

// POST: Join a competition (solo or create team)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const body = await request.json()
    const { competitionId, teamName } = body

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { stages: { orderBy: { stageNumber: 'asc' } } }
    })

    if (!competition) {
      return NextResponse.json({ error: 'Kompetisi tidak ditemukan' }, { status: 404 })
    }

    if (!competition.isActive || competition.verificationStatus !== 'approved') {
      return NextResponse.json({ error: 'Kompetisi tidak aktif' }, { status: 400 })
    }

    // Check if already participating
    const existing = await prisma.participation.findFirst({
      where: { userId, competitionId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Anda sudah terdaftar di kompetisi ini' }, { status: 400 })
    }

    // Check deadline
    if (new Date() > new Date(competition.deadline)) {
      return NextResponse.json({ error: 'Deadline kompetisi sudah terlewat' }, { status: 400 })
    }

    let teamId: number | null = null
    let inviteCode: string | null = null

    // Handle team competition
    if (competition.type === 'team') {
      const code = generateInviteCode()
      const team = await prisma.team.create({
        data: {
          competitionId,
          leaderId: userId,
          teamName: teamName || `Tim ${session.user.name}`,
          inviteCode: code,
          status: 'open',
        }
      })
      teamId = team.id
      inviteCode = code

      // Add leader as accepted member
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          status: 'accepted',
          role: 'Ketua',
        }
      })
    }

    // Create participation with default steps
    const participation = await prisma.participation.create({
      data: {
        userId,
        competitionId,
        teamId,
        status: 'registered',
        steps: {
          create: [
            { stepName: 'Pendaftaran', stepOrder: 1, isConfirmed: true, confirmedAt: new Date() },
            { stepName: 'Pengerjaan', stepOrder: 2 },
            { stepName: 'Submit Karya', stepOrder: 3 },
            { stepName: 'Pengumuman', stepOrder: 4 },
          ]
        }
      },
      include: {
        competition: { include: { category: true } },
        team: true,
        steps: true,
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'participation',
        title: 'Berhasil Mendaftar Lomba',
        body: `Anda berhasil mendaftar di kompetisi "${competition.title}"`,
        icon: 'fa-check-circle',
        color: '#22c55e',
      }
    })

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'join_competition',
          module: 'competition',
          description: `Joined competition: ${competition.title}`,
        }
      })
    } catch (e) {
      console.error('Failed to write activity log:', e)
    }

    return NextResponse.json({
      participation,
      inviteCode,
      message: competition.type === 'team'
        ? `Tim berhasil dibuat! Kode undangan: ${inviteCode}`
        : 'Berhasil mendaftar kompetisi!',
    })
  } catch (error) {
    console.error('POST /api/participations error:', error)
    return NextResponse.json({ error: 'Gagal mendaftar kompetisi' }, { status: 500 })
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'PST-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
