import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { AdminUsersClient } from '@/components/features/AdminUsersClient'

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  // Fetch initial users list
  const users = await prisma.user.findMany({
    include: {
      studentProfile: true,
      teacherProfile: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    photo: u.photo,
    waNumber: u.waNumber,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    profileDetail: u.role === 'student' ? {
      nis: u.studentProfile?.nis,
      kelas: u.studentProfile?.kelas,
      jurusan: u.studentProfile?.jurusan,
      angkatan: u.studentProfile?.angkatan
    } : u.role === 'teacher' ? {
      nip: u.teacherProfile?.nip,
      bidangKeahlian: u.teacherProfile?.bidangKeahlian,
      jabatan: u.teacherProfile?.jabatan
    } : null
  }))

  return (
    <DashboardLayout user={session.user} pageTitle="Manajemen Pengguna">
      <AdminUsersClient initialUsers={formatted} />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
