import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { TeacherExploreClient } from '@/components/features/TeacherExploreClient'

export default async function TeacherExplorePage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  // Fetch categories and fields
  const [categories, fields] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.field.findMany({ orderBy: { name: 'asc' } }),
  ])

  // Fetch initial competitions list
  const competitions = await prisma.competition.findMany({
    where: { isActive: true, verificationStatus: 'approved' },
    include: {
      category: true,
      field: true,
      _count: {
        select: { participations: true, teams: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const formattedComps = competitions.map(comp => ({
    id: comp.id,
    title: comp.title,
    organizer: comp.organizer,
    level: comp.level,
    type: comp.type,
    maxMembers: comp.maxMembers,
    minMembers: comp.minMembers,
    description: comp.description,
    requirements: comp.requirements,
    linkRegistration: comp.linkRegistration,
    guidebookLink: comp.guidebookLink,
    poster: comp.poster,
    cover: comp.cover,
    registerDeadline: comp.registerDeadline ? new Date(comp.registerDeadline).toISOString() : null,
    deadline: new Date(comp.deadline).toISOString(),
    announcementDate: comp.announcementDate ? new Date(comp.announcementDate).toISOString() : null,
    totalStages: comp.totalStages,
    isTrending: comp.isTrending,
    viewCount: comp.viewCount,
    createdAt: new Date(comp.createdAt).toISOString(),
    category: {
      id: comp.category.id,
      name: comp.category.name,
      icon: comp.category.icon,
      color: comp.category.color,
    },
    field: {
      id: comp.field.id,
      name: comp.field.name,
      icon: comp.field.icon,
    },
    stats: {
      participations: comp._count.participations,
      teams: comp._count.teams,
    }
  }))

  return (
    <DashboardLayout user={session.user} pageTitle="Eksplor Lomba">
      <TeacherExploreClient
        initialCompetitions={formattedComps}
        categories={categories.map(c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color }))}
        fields={fields.map(f => ({ id: f.id, name: f.name, icon: f.icon }))}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
