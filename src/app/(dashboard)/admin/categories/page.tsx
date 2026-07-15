import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { AdminCategoriesClient } from '@/components/features/AdminCategoriesClient'

export default async function AdminCategoriesPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  const [categories, fields] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.field.findMany({ orderBy: { name: 'asc' } })
  ])

  const serializedCats = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color
  }))

  const serializedFields = fields.map((f) => ({
    id: f.id,
    name: f.name,
    icon: f.icon
  }))

  return (
    <DashboardLayout user={session.user} pageTitle="Kategori &amp; Bidang">
      <AdminCategoriesClient categories={serializedCats} fields={serializedFields} />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
