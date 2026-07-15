import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { AdminDashboardClient } from '@/components/features/AdminDashboardClient'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  // Fetch school-wide stats
  const totalComps = await prisma.competition.count()
  const activeStudents = await prisma.user.count({ where: { role: 'student', isActive: true } })
  const activeParticipations = await prisma.participation.count({
    where: { status: { in: ['registered', 'in_progress', 'submitted'] } }
  })
  const totalJuara = await prisma.participation.count({
    where: { result: { in: ['juara_1', 'juara_2', 'juara_3', 'juara_harapan', 'favorit'] } }
  })

  // Group competitions by level for charts
  const levelCounts = await prisma.competition.groupBy({
    by: ['level'],
    _count: true
  })
  const levelData = levelCounts.map((lc) => ({
    name: lc.level.toUpperCase(),
    count: lc._count
  }))

  // Monthly stats of school participations (Last 6 Months)
  const monthlyStats = []
  const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = `${monthsName[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`

    const participationCount = await prisma.participation.count({
      where: {
        createdAt: {
          gte: new Date(d.getFullYear(), d.getMonth(), 1),
          lt: new Date(d.getFullYear(), d.getMonth() + 1, 1)
        }
      }
    })

    const winCount = await prisma.participation.count({
      where: {
        updatedAt: {
          gte: new Date(d.getFullYear(), d.getMonth(), 1),
          lt: new Date(d.getFullYear(), d.getMonth() + 1, 1)
        },
        result: { in: ['juara_1', 'juara_2', 'juara_3', 'juara_harapan'] }
      }
    })

    monthlyStats.push({
      month: label,
      pendaftaran: participationCount,
      prestasi: winCount
    })
  }

  return (
    <DashboardLayout user={session.user} pageTitle="Dashboard Administrator">
      <AdminDashboardClient
        stats={{
          totalComps,
          activeStudents,
          activeParticipations,
          totalJuara
        }}
        levelData={levelData}
        monthlyStats={monthlyStats}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
