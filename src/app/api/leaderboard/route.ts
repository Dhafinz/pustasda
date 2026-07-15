import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = parseInt(session.user.id)

    // Fetch all active students and their participations to compute leaderboard
    const students = await prisma.user.findMany({
      where: { role: 'student', isActive: true },
      include: {
        studentProfile: {
          select: { kelas: true, jurusan: true }
        },
        participations: {
          select: { result: true, status: true }
        }
      }
    })

    const computed = students.map((user) => {
      const totalLomba = user.participations.length
      const totalSubmit = user.participations.filter(p => ['submitted', 'completed'].includes(p.status)).length
      const totalJuara = user.participations.filter(p =>
        ['juara_1', 'juara_2', 'juara_3', 'juara_harapan'].includes(p.result)
      ).length

      // Calculating leaderboard points
      // Juara 1 = 3 pts, Juara 2 = 2 pts, Juara 3 = 1 pt, Juara Harapan / Favorit / Terpilih = 0.5 pts, Participated = 0.2 pts
      let points = 0
      user.participations.forEach((p) => {
        if (p.result === 'juara_1') points += 3.0
        else if (p.result === 'juara_2') points += 2.0
        else if (p.result === 'juara_3') points += 1.0
        else if (['juara_harapan', 'favorit', 'terpilih'].includes(p.result)) points += 0.5
        else if (['submitted', 'completed', 'registered', 'in_progress'].includes(p.status)) points += 0.2
      })

      // Round points to 1 decimal place
      points = Math.round(points * 10) / 10

      return {
        id: user.id,
        name: user.name,
        photo: user.photo,
        kelas: user.studentProfile?.kelas || '-',
        jurusan: user.studentProfile?.jurusan || '-',
        poin: points,
        juara: totalJuara,
        lomba: totalLomba,
        submit: totalSubmit,
        isYou: user.id === currentUserId
      }
    })

    // Sort by points desc, then juara desc, then total lomba desc
    const sorted = computed.sort((a, b) => b.poin - a.poin || b.juara - a.juara || b.lomba - a.lomba)

    // Find current user rank
    const myRankIdx = sorted.findIndex((s) => s.id === currentUserId)
    const myRankInfo = myRankIdx !== -1 ? {
      rank: myRankIdx + 1,
      ...sorted[myRankIdx]
    } : null

    return NextResponse.json({
      leaderboard: sorted,
      myRank: myRankInfo
    })
  } catch (error) {
    console.error('GET /api/leaderboard error:', error)
    return NextResponse.json({ error: 'Gagal memuat leaderboard' }, { status: 500 })
  }
}
