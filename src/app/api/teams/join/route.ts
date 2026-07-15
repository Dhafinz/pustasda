import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// POST: Join a team via invite code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: 'Kode undangan diperlukan' }, { status: 400 })
    }

    // Find team by invite code
    const team = await prisma.team.findUnique({
      where: { inviteCode },
      include: {
        competition: true,
        members: true,
        leader: { select: { id: true, name: true } }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Kode undangan tidak valid' }, { status: 404 })
    }

    if (team.status === 'closed' || team.status === 'full') {
      return NextResponse.json({ error: 'Tim sudah ditutup atau penuh' }, { status: 400 })
    }

    // Check if already a member
    const existingMember = team.members.find(m => m.userId === userId)
    if (existingMember) {
      return NextResponse.json({ error: 'Anda sudah menjadi anggota tim ini' }, { status: 400 })
    }

    // Check max members
    const acceptedMembers = team.members.filter(m => m.status === 'accepted')
    if (acceptedMembers.length >= team.competition.maxMembers) {
      // Auto-close team
      await prisma.team.update({
        where: { id: team.id },
        data: { status: 'full' }
      })
      return NextResponse.json({ error: 'Tim sudah penuh' }, { status: 400 })
    }

    // Check if already participating in same competition
    const existingParticipation = await prisma.participation.findFirst({
      where: { userId, competitionId: team.competitionId }
    })

    if (existingParticipation) {
      return NextResponse.json({ error: 'Anda sudah terdaftar di kompetisi ini' }, { status: 400 })
    }

    // Add as team member
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        status: 'accepted',
      }
    })

    // Create participation for this user
    await prisma.participation.create({
      data: {
        userId,
        competitionId: team.competitionId,
        teamId: team.id,
        status: 'registered',
        steps: {
          create: [
            { stepName: 'Pendaftaran', stepOrder: 1, isConfirmed: true, confirmedAt: new Date() },
            { stepName: 'Pengerjaan', stepOrder: 2 },
            { stepName: 'Submit Karya', stepOrder: 3 },
            { stepName: 'Pengumuman', stepOrder: 4 },
          ]
        }
      }
    })

    // Check if team is now full
    const updatedMemberCount = acceptedMembers.length + 1
    if (updatedMemberCount >= team.competition.maxMembers) {
      await prisma.team.update({
        where: { id: team.id },
        data: { status: 'full' }
      })
    }

    // Notify team leader
    await prisma.notification.create({
      data: {
        userId: team.leaderId,
        type: 'team_join',
        title: 'Anggota Baru Bergabung',
        body: `${session.user.name} bergabung ke tim "${team.teamName}" untuk kompetisi "${team.competition.title}"`,
        icon: 'fa-user-plus',
        color: '#3b82f6',
      }
    })

    return NextResponse.json({
      message: `Berhasil bergabung ke tim "${team.teamName}"`,
      team: {
        id: team.id,
        teamName: team.teamName,
        competitionTitle: team.competition.title,
        leaderName: team.leader.name,
      }
    })
  } catch (error) {
    console.error('POST /api/teams/join error:', error)
    return NextResponse.json({ error: 'Gagal bergabung ke tim' }, { status: 500 })
  }
}
