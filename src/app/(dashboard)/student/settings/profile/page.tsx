import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { StudentProfileClient } from '@/components/features/StudentProfileClient'

export default async function StudentProfileSettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'student') redirect('/login')

  const userId = parseInt(session.user.id)

  const student = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true }
  })

  if (!student) redirect('/login')

  const initialData = {
    name: student.name,
    email: student.email,
    waNumber: student.waNumber || '',
    nis: student.studentProfile?.nis || '',
    kelas: student.studentProfile?.kelas || '',
    jurusan: student.studentProfile?.jurusan || '',
    angkatan: student.studentProfile?.angkatan || '',
  }

  return (
    <DashboardLayout user={session.user} pageTitle="Pengaturan Profil">
      <StudentProfileClient initialData={initialData} />
    </DashboardLayout>
  )
}
