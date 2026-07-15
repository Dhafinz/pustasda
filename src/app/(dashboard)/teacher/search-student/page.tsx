import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { TeacherSearchStudentClient } from '@/components/features/TeacherSearchStudentClient'

export default async function TeacherSearchStudentPage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  // Load initial students to show
  const initialStudents = await prisma.user.findMany({
    where: { role: 'student', isActive: true },
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
    take: 10
  })

  const formatted = initialStudents.map((s) => {
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

  return (
    <DashboardLayout user={session.user} pageTitle="Cari Profil Siswa">
      <TeacherSearchStudentClient initialStudents={formatted} />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
