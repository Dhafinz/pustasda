import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // If query is empty, return empty list or top active students
    const where: any = { role: 'student', isActive: true }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { studentProfile: { nis: { contains: query } } }
      ]
    }

    const students = await prisma.user.findMany({
      where,
      include: {
        studentProfile: true,
        participations: {
          include: {
            competition: {
              include: { category: true }
            }
          }
        }
      },
      take: 15
    })

    const formatted = students.map((s) => {
      const activeParticipations = s.participations.filter(p => p.status !== 'completed' && p.status !== 'not_submitted')
      const completedParticipations = s.participations.filter(p => p.status === 'completed')
      const totalJuara = s.participations.filter(p =>
        ['juara_1', 'juara_2', 'juara_3', 'juara_harapan'].includes(p.result)
      ).length

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        photo: s.photo,
        nis: s.studentProfile?.nis || '-',
        kelas: s.studentProfile?.kelas || '-',
        jurusan: s.studentProfile?.jurusan || '-',
        bioAi: s.studentProfile?.bioAi || 'Belum mengikuti Kuis Karakter AI.',
        stats: {
          active: activeParticipations.length,
          completed: completedParticipations.length,
          juara: totalJuara
        },
        competitions: activeParticipations.map(p => ({
          id: p.competition.id,
          title: p.competition.title,
          categoryName: p.competition.category.name,
          categoryColor: p.competition.category.color,
          status: p.status
        }))
      }
    })

    return NextResponse.json({ students: formatted })
  } catch (error) {
    console.error('GET /api/teacher/students error:', error)
    return NextResponse.json({ error: 'Gagal mencari profil siswa' }, { status: 500 })
  }
}
