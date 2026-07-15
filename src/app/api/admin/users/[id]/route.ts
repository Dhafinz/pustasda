import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hashSync } from 'bcryptjs'

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
    const targetUserId = parseInt(id)
    const body = await request.json()
    const { name, email, role, password, isActive, extra1, extra2, extra3, angkatan } = body

    if (isNaN(targetUserId) || !name || !email || !role) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const updateData: any = { name, email, role, isActive }
    if (password && password.trim() !== '') {
      updateData.password = hashSync(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData
    })

    // Upsert Student Profile if student
    if (role === 'student') {
      await prisma.studentProfile.upsert({
        where: { userId: targetUserId },
        update: { 
          nis: extra1 || '-',
          kelas: extra2 || '-', 
          jurusan: extra3 || '-',
          angkatan: angkatan ? String(angkatan) : null
        },
        create: { 
          userId: targetUserId, 
          nis: extra1 || '-',
          kelas: extra2 || '-', 
          jurusan: extra3 || '-',
          angkatan: angkatan ? String(angkatan) : null
        }
      })
    }

    // Upsert Teacher Profile if teacher
    if (role === 'teacher') {
      await prisma.teacherProfile.upsert({
        where: { userId: targetUserId },
        update: { 
          nip: extra1 || '-', 
          bidangKeahlian: extra2 || '-',
          jabatan: extra3 || '-'
        },
        create: { 
          userId: targetUserId, 
          nip: extra1 || '-', 
          bidangKeahlian: extra2 || '-',
          jabatan: extra3 || '-'
        }
      })
    }

    return NextResponse.json({ message: 'User berhasil diperbarui', user: updatedUser })
  } catch (error) {
    console.error('PATCH /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui user' }, { status: 500 })
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
    const targetUserId = parseInt(id)

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    // Protect self-deletion
    if (targetUserId === parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun Anda sendiri' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: targetUserId }
    })

    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 })
  }
}
