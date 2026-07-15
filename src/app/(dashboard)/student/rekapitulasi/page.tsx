import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { StudentRekapitulasiClient } from '@/components/features/StudentRekapitulasiClient'

export default async function StudentRekapitulasiPage() {
  const session = await auth()
  if (!session || session.user.role !== 'student') redirect('/login')

  const userId = parseInt(session.user.id)

  // Fetch all participations for this student
  const participations = await prisma.participation.findMany({
    where: { userId },
    include: {
      competition: {
        include: {
          category: true,
          field: true
        }
      }
    }
  })

  // Calculate Stat metrics
  const totalLomba = participations.length
  const totalJuara = participations.filter((p) =>
    ['juara_1', 'juara_2', 'juara_3', 'juara_harapan', 'favorit'].includes(p.result)
  ).length
  const totalSubmit = participations.filter((p) =>
    ['submitted', 'completed'].includes(p.status)
  ).length
  const totalSelesai = participations.filter((p) =>
    p.status === 'completed'
  ).length

  // Calculate categories distribution
  const categoriesMap: Record<string, { count: number; color: string }> = {}
  participations.forEach((p) => {
    const cat = p.competition.category
    if (!categoriesMap[cat.name]) {
      categoriesMap[cat.name] = { count: 0, color: cat.color || '#e31e25' }
    }
    categoriesMap[cat.name].count++
  })
  const categoryData = Object.entries(categoriesMap).map(([name, val]) => ({
    name,
    value: val.count,
    color: val.color
  }))

  // Calculate fields distribution
  const fieldsMap: Record<string, number> = {}
  participations.forEach((p) => {
    const fieldName = p.competition.field.name
    fieldsMap[fieldName] = (fieldsMap[fieldName] || 0) + 1
  })
  const fieldData = Object.entries(fieldsMap).map(([name, count]) => ({
    name,
    count
  }))

  // Calculate monthly stats for Recharts LineChart (Last 6 Months)
  // Let's build a timeline of last 6 months
  const monthlyData: Array<{ month: string; count: number; submitCount: number }> = []
  const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthLabel = `${monthsName[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`

    // Count participations created in this month
    const createdInMonth = participations.filter((p) => {
      const pDate = new Date(p.createdAt)
      return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear()
    })

    const submittedInMonth = createdInMonth.filter((p) => ['submitted', 'completed'].includes(p.status))

    monthlyData.push({
      month: monthLabel,
      count: createdInMonth.length,
      submitCount: submittedInMonth.length
    })
  }

  // AI-generated summary simulation based on database details
  // In the future, this can hook to actual LLM. Right now we construct a customized dynamic response.
  let aiRecommendation = 'Anda belum mengikuti lomba. Segera daftarkan diri Anda di lomba terbaru untuk memetakan bakat dan minat!'
  if (totalLomba > 0) {
    const dominantField = Object.entries(fieldsMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Umum'
    aiRecommendation = `Berdasarkan rekap analisis PUSTASDA, Anda menunjukkan minat kuat pada bidang "${dominantField}" (${fieldsMap[dominantField] || 0} lomba). `
    if (totalJuara > 0) {
      aiRecommendation += `Dengan tingkat kemenangan ${Math.round((totalJuara / totalLomba) * 100)}%, Anda memiliki peluang besar di kompetisi berskala Nasional berikutnya. Disarankan mengambil lomba individu bidang sejenis untuk memaksimalkan poin prestasi!`
    } else {
      aiRecommendation += 'Tingkatkan frekuensi submit karya dan ajukan guru pembimbing di setiap lomba untuk mengoptimalkan pendampingan teknis agar memperbesar peluang juara!'
    }
  }

  return (
    <DashboardLayout user={session.user} pageTitle="Rekapitulasi">
      <StudentRekapitulasiClient
        stats={{
          totalLomba,
          totalJuara,
          totalSubmit,
          totalSelesai
        }}
        categoryData={categoryData}
        fieldData={fieldData}
        monthlyData={monthlyData}
        aiSummary={aiRecommendation}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
