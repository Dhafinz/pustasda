import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { AdminCompetitionsClient } from '@/components/features/AdminCompetitionsClient'

export default async function AdminCompetitionsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/login')

  // Fetch initial competitions
  const competitions = await prisma.competition.findMany({
    include: {
      category: true,
      field: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch categories and fields for add competition dropdowns
  const [categories, fields] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.field.findMany({ orderBy: { name: 'asc' } })
  ])

  const formatted = competitions.map((c) => ({
    id: c.id,
    title: c.title,
    organizer: c.organizer,
    level: c.level,
    type: c.type,
    maxMembers: c.maxMembers,
    minMembers: c.minMembers,
    deadline: c.deadline.toISOString(),
    isTrending: c.isTrending,
    isActive: c.isActive,
    categoryName: c.category.name,
    categoryColor: c.category.color,
    fieldName: c.field.name,
    categoryId: c.categoryId,
    fieldId: c.fieldId,
    description: c.description,
    requirements: c.requirements,
    linkRegistration: c.linkRegistration,
    guidebookLink: c.guidebookLink,
    poster: c.poster
  }))

  const serializedCats = categories.map((c) => ({ id: c.id, name: c.name }))
  const serializedFields = fields.map((f) => ({ id: f.id, name: f.name, categoryId: f.categoryId }))

  return (
    <DashboardLayout user={session.user} pageTitle="Manajemen Lomba">
      <AdminCompetitionsClient
        initialCompetitions={formatted}
        categories={serializedCats}
        fields={serializedFields}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
