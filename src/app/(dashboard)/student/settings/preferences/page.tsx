import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { StudentPreferencesClient } from '@/components/features/StudentPreferencesClient'

export default async function StudentPreferencesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'student') redirect('/login')

  const userId = parseInt(session.user.id)

  const profile = await prisma.studentProfile.findUnique({
    where: { userId }
  })

  if (!profile) redirect('/login')

  const initialPreferences = {
    privacyProfile: profile.privacyProfile || 'public',
    allowTeamInvite: profile.allowTeamInvite,
    notificationPref: profile.notificationPref || 'all'
  }

  return (
    <DashboardLayout user={session.user} pageTitle="Preferensi">
      <StudentPreferencesClient initialPreferences={initialPreferences} />
    </DashboardLayout>
  )
}
