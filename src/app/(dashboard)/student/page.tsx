import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { StudentBerandaClient } from '@/components/features/StudentBerandaClient'

export default async function StudentDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'student') redirect('/login')

  const userId = parseInt(session.user.id)

  // Fetch stats
  const totalParticipations = await prisma.participation.count({ where: { userId } })

  const participationsWithResults = await prisma.participation.findMany({
    where: { userId },
    select: { result: true, status: true }
  })

  const totalJuara = participationsWithResults.filter(p =>
    ['juara_1', 'juara_2', 'juara_3', 'juara_harapan'].includes(p.result)
  ).length

  const unreadNotifs = await prisma.notification.count({
    where: { userId, isRead: false }
  })

  // Fetch competitions by category
  const trendingComps = await prisma.competition.findMany({
    where: { isTrending: true, isActive: true, verificationStatus: 'approved' },
    include: { category: true, field: true },
    orderBy: { viewCount: 'desc' },
    take: 10
  })

  const nasionalComps = await prisma.competition.findMany({
    where: { level: 'nasional', isActive: true, verificationStatus: 'approved' },
    include: { category: true, field: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const newestComps = await prisma.competition.findMany({
    where: { isActive: true, verificationStatus: 'approved' },
    include: { category: true, field: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const deadlineSoonComps = await prisma.competition.findMany({
    where: {
      isActive: true,
      verificationStatus: 'approved',
      deadline: { gte: new Date() }
    },
    include: { category: true, field: true },
    orderBy: { deadline: 'asc' },
    take: 10
  })

  // All competitions for the main grid (first page)
  const allComps = await prisma.competition.findMany({
    where: { isActive: true, verificationStatus: 'approved' },
    include: { category: true, field: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const totalComps = await prisma.competition.count({
    where: { isActive: true, verificationStatus: 'approved' }
  })

  // Leaderboard
  const leaderboard = await prisma.user.findMany({
    where: { role: 'student', isActive: true },
    include: {
      participations: {
        select: { result: true, status: true }
      },
      studentProfile: true
    },
    take: 5
  })

  const leaderboardData = leaderboard.map(user => {
    const totalLomba = user.participations.length
    const totalSubmit = user.participations.filter(p => ['submitted', 'completed'].includes(p.status)).length
    const juaraCount = user.participations.filter(p =>
      ['juara_1', 'juara_2', 'juara_3', 'juara_harapan'].includes(p.result)
    ).length
    const poin = user.participations.reduce((acc, p) => {
      if (p.result === 'juara_1') return acc + 3
      if (p.result === 'juara_2') return acc + 2
      if (p.result === 'juara_3') return acc + 1
      return acc
    }, 0)

    return {
      id: user.id,
      name: user.name,
      photo: user.photo,
      kelas: user.studentProfile?.kelas || '-',
      jurusan: user.studentProfile?.jurusan || '-',
      poin,
      juara: juaraCount,
      lomba: totalLomba,
      isYou: user.id === userId
    }
  }).sort((a, b) => b.poin - a.poin || b.juara - a.juara || b.lomba - a.lomba)

  // Format helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const formatComp = (comp: any) => ({
    id: comp.id,
    title: comp.title,
    organizer: comp.organizer,
    level: comp.level,
    type: comp.type,
    deadline: formatDate(comp.deadline),
    poster: comp.poster,
    linkRegistration: comp.linkRegistration,
    category: {
      name: comp.category.name,
      color: comp.category.color || '#e31e25',
      icon: comp.category.icon || 'fa-trophy'
    }
  })

  const quotes = [
    '"Kompetisi bukan tentang mengalahkan orang lain, tapi melampaui diri sendiri."',
    '"Prestasi bukanlah kebetulan, melainkan hasil kerja keras dan ketekunan."',
    '"Juara sejati tidak dibentuk dari kemenangan saja, tapi dari bangkitnya setelah terjatuh."',
    '"Fokus pada proses, hasil akan mengikuti kerja kerasmu."'
  ]

  return (
    <DashboardLayout user={session.user} pageTitle="Beranda">
      <StudentBerandaClient
        userName={session.user.name}
        stats={{
          lombaIkuti: totalParticipations,
          kaliJuara: totalJuara,
          notifBaru: unreadNotifs
        }}
        quote={quotes[userId % quotes.length]}
        trendingComps={trendingComps.map(formatComp)}
        nasionalComps={nasionalComps.map(formatComp)}
        newestComps={newestComps.map(formatComp)}
        deadlineSoonComps={deadlineSoonComps.map(formatComp)}
        allComps={allComps.map(formatComp)}
        totalComps={totalComps}
        leaderboard={leaderboardData}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
