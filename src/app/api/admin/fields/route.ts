import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fields = await prisma.field.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ fields })
  } catch (error) {
    console.error('GET /api/admin/fields error:', error)
    return NextResponse.json({ error: 'Gagal memuat bidang' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, icon } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nama bidang wajib diisi' }, { status: 400 })
    }

    const field = await prisma.field.create({
      data: {
        name,
        icon: icon || 'fa-star'
      }
    })

    return NextResponse.json({
      message: 'Bidang baru berhasil dibuat',
      field
    })
  } catch (error) {
    console.error('POST /api/admin/fields error:', error)
    return NextResponse.json({ error: 'Gagal membuat bidang' }, { status: 500 })
  }
}
