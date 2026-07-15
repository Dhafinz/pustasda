import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { TeacherPreferencesClient } from '@/components/features/TeacherPreferencesClient'

export default async function TeacherPreferencesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  return (
    <DashboardLayout user={session.user} pageTitle="Preferensi Guru">
      <TeacherPreferencesClient />
    </DashboardLayout>
  )
}
