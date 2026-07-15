import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { StudentParticipationsClient } from '@/components/features/StudentParticipationsClient'

export default async function StudentParticipationsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'student') redirect('/login')

  const userId = parseInt(session.user.id)

  // Fetch student's participations with full details
  const participations = await prisma.participation.findMany({
    where: { userId },
    include: {
      competition: {
        include: {
          category: true,
          field: true,
          stages: {
            orderBy: { stageNumber: 'asc' }
          }
        }
      },
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, photo: true, email: true }
              }
            }
          },
          leader: {
            select: { id: true, name: true, photo: true }
          }
        }
      },
      steps: {
        orderBy: { stepOrder: 'asc' }
      },
      mentorship: {
        include: {
          teacher: {
            select: { id: true, name: true, photo: true, email: true }
          },
          activities: {
            orderBy: { scheduleDate: 'desc' }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch active teachers for mentorship selection
  const teachers = await prisma.user.findMany({
    where: { role: 'teacher', isActive: true },
    select: {
      id: true,
      name: true,
      photo: true,
      teacherProfile: {
        select: {
          bidangKeahlian: true,
          jabatan: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Format data for serialization
  const formattedParticipations = await Promise.all(participations.map(async (p) => {
    const now = new Date()
    const deadline = new Date(p.competition.deadline)
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // If student is in a team and is not the leader, fetch the leader's mentorship details
    let activeMentorship = p.mentorship
    if (p.team && p.team.leaderId !== userId) {
      const leaderMentorship = await prisma.mentorship.findFirst({
        where: {
          participation: {
            teamId: p.teamId,
            userId: p.team.leaderId
          }
        },
        include: {
          teacher: {
            select: { id: true, name: true, photo: true, email: true }
          },
          activities: {
            orderBy: { scheduleDate: 'desc' }
          }
        }
      })
      if (leaderMentorship) {
        activeMentorship = leaderMentorship
      }
    }

    return {
      id: p.id,
      userId: p.userId,
      competitionId: p.competitionId,
      teamId: p.teamId,
      status: p.status,
      result: p.result,
      currentStage: p.currentStage,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      daysRemaining,
      competition: {
        id: p.competition.id,
        title: p.competition.title,
        organizer: p.competition.organizer,
        level: p.competition.level,
        type: p.competition.type,
        maxMembers: p.competition.maxMembers,
        minMembers: p.competition.minMembers,
        description: p.competition.description,
        requirements: p.competition.requirements,
        poster: p.competition.poster,
        cover: p.competition.cover,
        deadline: p.competition.deadline.toISOString(),
        category: {
          id: p.competition.category.id,
          name: p.competition.category.name,
          icon: p.competition.category.icon,
          color: p.competition.category.color,
        },
        field: {
          id: p.competition.field.id,
          name: p.competition.field.name,
          icon: p.competition.field.icon,
        },
        stages: p.competition.stages.map(s => ({
          id: s.id,
          stageNumber: s.stageNumber,
          stageName: s.stageName,
          deadline: s.deadline ? s.deadline.toISOString() : null,
          description: s.description
        }))
      },
      team: p.team ? {
        id: p.team.id,
        teamName: p.team.teamName,
        inviteCode: p.team.inviteCode,
        status: p.team.status,
        leaderId: p.team.leaderId,
        leader: p.team.leader,
        members: p.team.members.map(m => ({
          id: m.id,
          userId: m.userId,
          status: m.status,
          role: m.role,
          user: m.user
        }))
      } : null,
      steps: p.steps.map(s => ({
        id: s.id,
        stepName: s.stepName,
        stepOrder: s.stepOrder,
        isConfirmed: s.isConfirmed,
        confirmedAt: s.confirmedAt ? s.confirmedAt.toISOString() : null,
        notes: s.notes
      })),
      mentorship: activeMentorship ? {
        id: activeMentorship.id,
        status: activeMentorship.status,
        teacher: activeMentorship.teacher,
        activities: activeMentorship.activities.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          scheduleDate: a.scheduleDate ? a.scheduleDate.toISOString() : null,
          status: a.status,
          teacherNotes: a.teacherNotes,
          documentUrl: a.documentUrl,
          location: a.location
        }))
      } : null
    }
  }))

  const formattedTeachers = teachers.map(t => ({
    id: t.id,
    name: t.name,
    photo: t.photo,
    bidang: t.teacherProfile?.bidangKeahlian || 'Umum',
    jabatan: t.teacherProfile?.jabatan || 'Guru'
  }))

  return (
    <DashboardLayout user={session.user} pageTitle="Lomba Saya">
      <StudentParticipationsClient
        initialParticipations={formattedParticipations}
        teachers={formattedTeachers}
        currentUserId={userId}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
