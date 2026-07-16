import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { TeacherProfileClient } from '@/components/features/TeacherProfileClient'

export default async function TeacherProfileSettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  const userId = parseInt(session.user.id)

  const teacher = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true }
  })

  if (!teacher) redirect('/login')

  const initialData = {
    name: teacher.name,
    email: teacher.email,
    waNumber: teacher.waNumber || '',
    nip: teacher.teacherProfile?.nip || '',
    bidangKeahlian: teacher.teacherProfile?.bidangKeahlian || '',
    jabatan: teacher.teacherProfile?.jabatan || '',
    photo: teacher.photo || '',
  }

  return (
    <DashboardLayout user={session.user} pageTitle="Pengaturan Profil Guru">
      <TeacherProfileClient initialData={initialData} />
    </DashboardLayout>
  )
}
