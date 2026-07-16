import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { AdminMonitoringClient } from '@/components/features/AdminMonitoringClient'

export default async function AdminMonitoringPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  // Fetch all participations that have mentorship requests
  const mentorships = await prisma.mentorship.findMany({
    include: {
      teacher: { select: { id: true, name: true } },
      participation: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          competition: { select: { id: true, title: true, organizer: true } },
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        }
      },
      activities: {
        orderBy: { scheduleDate: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const formatted = mentorships.map(m => ({
    id: m.id,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    teacherName: m.teacher.name,
    student: m.participation.user,
    competition: m.participation.competition,
    participation: {
      id: m.participation.id,
      status: m.participation.status,
      result: m.participation.result,
      notes: m.participation.notes,
      steps: m.participation.steps.map(s => ({
        id: s.id,
        stepName: s.stepName,
        stepOrder: s.stepOrder,
        isConfirmed: s.isConfirmed,
        confirmedAt: s.confirmedAt ? s.confirmedAt.toISOString() : null,
        notes: s.notes
      }))
    },
    activities: m.activities.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      scheduleDate: a.scheduleDate ? a.scheduleDate.toISOString() : null,
      status: a.status,
      teacherNotes: a.teacherNotes,
      documentUrl: a.documentUrl,
      location: a.location
    }))
  }))

  return (
    <DashboardLayout user={session.user} pageTitle="Monitoring Bimbingan">
      <AdminMonitoringClient initialMentorships={formatted} />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
