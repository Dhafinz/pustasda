import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { TeacherBimbinganClient } from '@/components/features/TeacherBimbinganClient'

export default async function TeacherBimbinganPage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  const teacherId = parseInt(session.user.id)

  // Fetch mentorships assigned to this teacher
  const mentorships = await prisma.mentorship.findMany({
    where: { teacherId },
    include: {
      participation: {
        include: {
          user: {
            select: { id: true, name: true, email: true, photo: true }
          },
          competition: {
            include: {
              category: true,
              field: true
            }
          },
          team: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, photo: true } }
                }
              }
            }
          }
        }
      },
      activities: {
        orderBy: { scheduleDate: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Format data for JSON serialization
  const formattedMentorships = mentorships.map(m => ({
    id: m.id,
    participationId: m.participationId,
    teacherId: m.teacherId,
    status: m.status,
    respondedAt: m.respondedAt ? m.respondedAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    student: {
      id: m.participation.user.id,
      name: m.participation.user.name,
      email: m.participation.user.email,
      photo: m.participation.user.photo
    },
    competition: {
      id: m.participation.competition.id,
      title: m.participation.competition.title,
      organizer: m.participation.competition.organizer,
      level: m.participation.competition.level,
      type: m.participation.competition.type,
      category: {
        name: m.participation.competition.category.name,
        color: m.participation.competition.category.color,
        icon: m.participation.competition.category.icon
      }
    },
    team: m.participation.team ? {
      id: m.participation.team.id,
      teamName: m.participation.team.teamName,
      members: m.participation.team.members.map(mem => ({
        id: mem.id,
        name: mem.user.name,
        role: mem.role
      }))
    } : null,
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
    <DashboardLayout user={session.user} pageTitle="Bimbingan Siswa">
      <TeacherBimbinganClient initialMentorships={formattedMentorships} />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
