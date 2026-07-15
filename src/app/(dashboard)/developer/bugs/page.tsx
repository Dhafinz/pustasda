import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { DeveloperBugsClient } from '@/components/features/DeveloperBugsClient'

export default async function DeveloperBugsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'developer') redirect('/login')

  // Initial simulated bugs
  const initialBugs = [
    { id: 1, title: 'Prisma Client Query Timeout in SQLite on Concurrent Writes', module: 'database', severity: 'medium', detectedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, title: 'NextAuth Session Expiration handling on Client Components redirect loop', module: 'auth', severity: 'high', detectedAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, title: 'Fonnte WhatsApp API response timeout - Request rate exceeded', module: 'notification', severity: 'low', detectedAt: new Date(Date.now() - 172800000).toISOString() }
  ]

  return (
    <DashboardLayout user={session.user} pageTitle="Bug Analysis">
      <DeveloperBugsClient initialBugs={initialBugs} />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
