import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// DELETE: Kick a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, memberId } = await params
    const teamId = parseInt(id)
    const teamMemberId = parseInt(memberId)
    const userId = parseInt(session.user.id)

    if (isNaN(teamId) || isNaN(teamMemberId)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    // Find the team
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json({ error: 'Tim tidak ditemukan' }, { status: 404 })
    }

    // Only leader can kick team members
    if (team.leaderId !== userId) {
      return NextResponse.json({ error: 'Hanya ketua tim yang dapat mengeluarkan anggota' }, { status: 401 })
    }

    // Find the member to be kicked
    const member = await prisma.teamMember.findUnique({
      where: { id: teamMemberId }
    })

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    // Cannot kick the leader
    if (member.userId === team.leaderId) {
      return NextResponse.json({ error: 'Tidak dapat mengeluarkan ketua tim' }, { status: 400 })
    }

    // Delete the member's participation in this competition
    await prisma.participation.deleteMany({
      where: {
        userId: member.userId,
        competitionId: team.competitionId
      }
    })

    // Delete the team member record
    await prisma.teamMember.delete({
      where: { id: teamMemberId }
    })

    // Create kick notification for the kicked user
    await prisma.notification.create({
      data: {
        userId: member.userId,
        type: 'team_kick',
        title: 'Dikeluarkan dari Tim',
        body: `Anda telah dikeluarkan dari tim "${team.teamName}" untuk kompetisi.`,
        icon: 'fa-user-minus',
        color: '#ef4444',
      }
    })

    return NextResponse.json({
      message: 'Anggota tim berhasil dikeluarkan'
    })
  } catch (error) {
    console.error('DELETE /api/teams/[id]/members/[memberId] error:', error)
    return NextResponse.json({ error: 'Gagal mengeluarkan anggota tim' }, { status: 500 })
  }
}
