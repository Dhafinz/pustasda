import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hashSync } from 'bcryptjs'

// GET: Retrieve all users
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || ''
    const search = searchParams.get('q') || ''

    const where: any = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        studentProfile: true,
        teacherProfile: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      photo: u.photo,
      waNumber: u.waNumber,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      profileDetail: u.role === 'student' ? {
        nis: u.studentProfile?.nis,
        kelas: u.studentProfile?.kelas,
        jurusan: u.studentProfile?.jurusan,
        angkatan: u.studentProfile?.angkatan
      } : u.role === 'teacher' ? {
        nip: u.teacherProfile?.nip,
        bidangKeahlian: u.teacherProfile?.bidangKeahlian,
        jabatan: u.teacherProfile?.jabatan
      } : null
    }))

    return NextResponse.json({ users: formatted })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Gagal memuat pengguna' }, { status: 500 })
  }
}

// POST: Add single user or Bulk upload (Burst creation)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { users } = body // Expecting { users: [ { name, email, password, role, isBulk, nis/nip, kelas, jurusan/bidang } ] }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Data pengguna tidak valid' }, { status: 400 })
    }

    const createdUsers = []
    const duplicateEmails = []

    for (const u of users) {
      const { name, email, password, role, extra1, extra2, extra3, angkatan } = u // extra1: nis/nip, extra2: kelas/bidang, extra3: jurusan/jabatan, angkatan: student angkatan

      // Check duplicate email
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        duplicateEmails.push(email)
        continue
      }

      const hashedPassword = hashSync(password || 'password123', 10)

      // Create user
      const created = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'student',
          photo: 'default-avatar.png',
          isActive: true
        }
      })

      // Create profiles
      if (created.role === 'student') {
        await prisma.studentProfile.create({
          data: {
            userId: created.id,
            nis: extra1 || `NIS-${created.id}`,
            kelas: extra2 || 'XII',
            jurusan: extra3 || 'SIJA',
            angkatan: angkatan ? String(angkatan) : '2026'
          }
        })
      } else if (created.role === 'teacher') {
        await prisma.teacherProfile.create({
          data: {
            userId: created.id,
            nip: extra1 || `NIP-${created.id}`,
            bidangKeahlian: extra2 || 'Teknologi Informasi',
            jabatan: extra3 || 'Guru Produktif'
          }
        })
      }

      createdUsers.push(created)
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'admin_bulk_user_create',
        module: 'admin',
        description: `Created ${createdUsers.length} users. Duplicates skipped: ${duplicateEmails.join(', ') || 'None'}`
      }
    })

    return NextResponse.json({
      message: `Berhasil memproses pembuatan akun`,
      createdCount: createdUsers.length,
      skippedCount: duplicateEmails.length,
      skippedEmails: duplicateEmails
    })
  } catch (error) {
    console.error('POST /api/admin/users error:', error)
    return NextResponse.json({ error: 'Gagal memproses pembuatan pengguna' }, { status: 500 })
  }
}
