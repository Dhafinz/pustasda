import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'
import { DeveloperSettingsClient } from '@/components/features/DeveloperSettingsClient'

export default async function DeveloperSettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'developer') redirect('/login')

  // Load current values from AppSettings table
  const settingsList = await prisma.appSetting.findMany({
    where: { group: 'appearance' }
  })

  const primaryColorSetting = settingsList.find(s => s.key === 'primary_color')?.value || '#e31e25'
  const appIconSetting = settingsList.find(s => s.key === 'app_icon')?.value || 'Pustasda Icon'

  return (
    <DashboardLayout user={session.user} pageTitle="Pengaturan App">
      <DeveloperSettingsClient
        initialColor={primaryColorSetting}
        initialIcon={appIconSetting}
      />
      <ChatbotFAB />
    </DashboardLayout>
  )
}
