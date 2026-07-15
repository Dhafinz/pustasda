import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// PATCH: Update team member role (role tag)
export async function PATCH(
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
    const { role } = await request.json()

    if (isNaN(teamId) || isNaN(teamMemberId)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json({ error: 'Tim tidak ditemukan' }, { status: 404 })
    }

    // Only leader can set team role tags
    if (team.leaderId !== userId) {
      return NextResponse.json({ error: 'Hanya ketua tim yang dapat mengubah role anggota' }, { status: 401 })
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: { role: role || '' }
    })

    return NextResponse.json({
      message: 'Role anggota berhasil diperbarui',
      member: updatedMember
    })
  } catch (error) {
    console.error('PATCH /api/teams/[id]/members/[memberId]/role error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui role anggota' }, { status: 500 })
  }
}
