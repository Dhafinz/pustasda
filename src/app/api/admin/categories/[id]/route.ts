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
    const catId = parseInt(id)
    const { name, icon, color } = await request.json()

    if (isNaN(catId) || !name) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const updated = await prisma.category.update({
      where: { id: catId },
      data: { name, icon, color }
    })

    return NextResponse.json({ message: 'Kategori berhasil diperbarui', category: updated })
  } catch (error) {
    console.error('PATCH /api/admin/categories/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 })
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
    const catId = parseInt(id)

    if (isNaN(catId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id: catId }
    })

    return NextResponse.json({ message: 'Kategori berhasil dihapus' })
  } catch (error) {
    console.error('DELETE /api/admin/categories/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 })
  }
}
