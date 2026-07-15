import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { StudentQuizClient } from '@/components/features/StudentQuizClient'

export default async function StudentQuizPage() {
  const session = await auth()
  if (!session || session.user.role !== 'student') redirect('/login')

  const userId = parseInt(session.user.id)

  const profile = await prisma.studentProfile.findUnique({
    where: { userId }
  })

  return (
    <DashboardLayout user={session.user} pageTitle="Kuis Karakter Minat Bakat">
      <StudentQuizClient existingBio={profile?.bioAi || null} />
    </DashboardLayout>
  )
}
