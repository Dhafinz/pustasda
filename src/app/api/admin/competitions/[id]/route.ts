import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const compId = parseInt(id)
    const body = await request.json()
    const { title, organizer, categoryId, fieldId, level, type, description, requirements, deadline, registerDeadline, announcementDate, linkRegistration, guidebookLink, poster, minMembers, maxMembers, isTrending, isActive } = body

    if (isNaN(compId) || !title || !organizer || !categoryId || !fieldId || !level || !type) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const updated = await prisma.competition.update({
      where: { id: compId },
      data: {
        title,
        organizer,
        categoryId: parseInt(categoryId),
        fieldId: parseInt(fieldId),
        level,
        type,
        description,
        requirements,
        deadline: new Date(deadline),
        registerDeadline: registerDeadline ? new Date(registerDeadline) : null,
        announcementDate: announcementDate ? new Date(announcementDate) : null,
        linkRegistration,
        guidebookLink,
        poster,
        minMembers: minMembers ? parseInt(minMembers) : 1,
        maxMembers: maxMembers ? parseInt(maxMembers) : 1,
        isTrending: !!isTrending,
        isActive: isActive !== undefined ? !!isActive : true
      }
    })

    return NextResponse.json({ message: 'Kompetisi berhasil diperbarui', competition: updated })
  } catch (error) {
    console.error('PATCH /api/admin/competitions/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui kompetisi' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const compId = parseInt(id)

    if (isNaN(compId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await prisma.competition.delete({
      where: { id: compId }
    })

    return NextResponse.json({ message: 'Kompetisi berhasil dihapus' })
  } catch (error) {
    console.error('DELETE /api/admin/competitions/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus kompetisi' }, { status: 500 })
  }
}
