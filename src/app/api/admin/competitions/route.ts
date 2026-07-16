import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET: Fetch all competitions including unapproved
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comps = await prisma.competition.findMany({
      include: {
        category: true,
        field: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ competitions: comps })
  } catch (error) {
    console.error('GET /api/admin/competitions error:', error)
    return NextResponse.json({ error: 'Gagal memuat kompetisi' }, { status: 500 })
  }
}

// POST: Create a new competition (Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminId = parseInt(session.user.id)
    const body = await request.json()
    const {
      title,
      organizer,
      categoryId,
      fieldId,
      level,
      type,
      maxMembers,
      minMembers,
      description,
      requirements,
      linkRegistration,
      guidebookLink,
      deadline,
      registerDeadline,
      isTrending,
      poster
    } = body

    if (!title || !organizer || !categoryId || !fieldId || !deadline) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 })
    }

    const parsedCategoryId = parseInt(categoryId)
    const parsedFieldId = parseInt(fieldId)

    if (isNaN(parsedCategoryId) || isNaN(parsedFieldId)) {
      return NextResponse.json({ error: 'Data bidang/kategori tidak valid' }, { status: 400 })
    }

    const selectedField = await prisma.field.findUnique({
      where: { id: parsedFieldId },
      select: { categoryId: true }
    })

    if (!selectedField || selectedField.categoryId !== parsedCategoryId) {
      return NextResponse.json({ error: 'Kategori tidak sesuai dengan bidang yang dipilih' }, { status: 400 })
    }

    const created = await prisma.competition.create({
      data: {
        title,
        organizer,
        categoryId: parsedCategoryId,
        fieldId: parsedFieldId,
        createdBy: adminId,
        level: level || 'nasional',
        type: type || 'solo',
        maxMembers: type === 'team' ? parseInt(maxMembers || '3') : 1,
        minMembers: type === 'team' ? parseInt(minMembers || '1') : 1,
        description: description || '',
        requirements: requirements || '',
        linkRegistration: linkRegistration || '',
        guidebookLink: guidebookLink || '',
        deadline: new Date(deadline),
        registerDeadline: registerDeadline ? new Date(registerDeadline) : null,
        isTrending: isTrending || false,
        verificationStatus: 'approved',
        isActive: true,
        poster: poster || null,
        stages: {
          create: [
            { stageNumber: 1, stageName: 'Pendaftaran', description: 'Registrasi data & berkas administratif' },
            { stageNumber: 2, stageName: 'Finalisasi / Pengerjaan', description: 'Pelaksanaan pengerjaan karya kompetisi' }
          ]
        }
      }
    })

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'admin_competition_create',
        module: 'admin',
        description: `Created competition: ${title}`
      }
    })

    return NextResponse.json({
      message: 'Kompetisi baru berhasil dibuat',
      competition: created
    })
  } catch (error) {
    console.error('POST /api/admin/competitions error:', error)
    return NextResponse.json({ error: 'Gagal membuat kompetisi' }, { status: 500 })
  }
}
