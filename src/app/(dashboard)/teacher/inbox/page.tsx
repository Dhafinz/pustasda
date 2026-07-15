import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { TeacherInboxClient } from '@/components/features/TeacherInboxClient'

export default async function TeacherInboxPage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  const teacherId = parseInt(session.user.id)

  // Fetch only pending mentorship requests
  const pendingRequests = await prisma.mentorship.findMany({
    where: { teacherId, status: 'pending' },
    include: {
      participation: {
        include: {
          user: true,
          competition: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const formattedRequests = pendingRequests.map(r => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    student: {
      name: r.participation.user.name,
      email: r.participation.user.email
    },
    competition: {
      title: r.participation.competition.title,
      organizer: r.participation.competition.organizer,
      level: r.participation.competition.level,
      category: {
        name: r.participation.competition.category.name,
        color: r.participation.competition.category.color
      }
    }
  }))

  return (
    <DashboardLayout user={session.user} pageTitle="Kotak Masuk Pengajuan">
      <TeacherInboxClient requests={formattedRequests} />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
