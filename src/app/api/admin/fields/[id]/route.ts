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
    const fieldId = parseInt(id)
    const { name, icon, categoryId } = await request.json()

    if (isNaN(fieldId) || !name) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const updated = await prisma.field.update({
      where: { id: fieldId },
      data: { 
        name, 
        icon,
        categoryId: categoryId ? parseInt(categoryId) : null
      }
    })

    return NextResponse.json({ message: 'Bidang berhasil diperbarui', field: updated })
  } catch (error) {
    console.error('PATCH /api/admin/fields/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui bidang' }, { status: 500 })
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
    const fieldId = parseInt(id)

    if (isNaN(fieldId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await prisma.field.delete({
      where: { id: fieldId }
    })

    return NextResponse.json({ message: 'Bidang berhasil dihapus' })
  } catch (error) {
    console.error('DELETE /api/admin/fields/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus bidang' }, { status: 500 })
  }
}
