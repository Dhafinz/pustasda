import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import os from 'os'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { DeveloperDashboardClient } from '@/components/features/DeveloperDashboardClient'

export default async function DeveloperDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'developer') redirect('/login')

  // Auto delete logs older than 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  await prisma.activityLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo }
    }
  })

  // Fetch count statistics for all tables in Prisma
  const [
    user, studentprofile, teacherprofile, category, field, competition,
    competitionstage, savefolder, competitionsave, team, teammember,
    participation, participationstep, mentorship, mentorshipactivity,
    notification, badge, userbadge, appsetting, activitylog, sessionCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.category.count(),
    prisma.field.count(),
    prisma.competition.count(),
    prisma.competitionStage.count(),
    prisma.saveFolder.count(),
    prisma.competitionSave.count(),
    prisma.team.count(),
    prisma.teamMember.count(),
    prisma.participation.count(),
    prisma.participationStep.count(),
    prisma.mentorship.count(),
    prisma.mentorshipActivity.count(),
    prisma.notification.count(),
    prisma.badge.count(),
    prisma.userBadge.count(),
    prisma.appSetting.count(),
    prisma.activityLog.count(),
    prisma.session.count()
  ])

  const tableCounts = {
    user,
    studentprofile,
    teacherprofile,
    category,
    field,
    competition,
    competitionstage,
    savefolder,
    competitionsave,
    team,
    teammember,
    participation,
    participationstep,
    mentorship,
    mentorshipactivity,
    notification,
    badge,
    userbadge,
    appsetting,
    activitylog,
    session: sessionCount
  }

  // Fetch recent activity logs
  const logs = await prisma.activityLog.findMany({
    include: {
      user: { select: { name: true, role: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const formattedLogs = logs.map(l => ({
    id: l.id,
    createdAt: l.createdAt.toISOString(),
    action: l.action,
    description: l.description,
    user: l.user ? { name: l.user.name, role: l.user.role } : null
  }))

  // Server hardware resources info
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
    freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
    nodeVersion: process.version
  }

  return (
    <DashboardLayout user={session.user} pageTitle="System Stats">
      <DeveloperDashboardClient
        systemInfo={systemInfo}
        tableCounts={tableCounts}
        initialLogs={formattedLogs}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
