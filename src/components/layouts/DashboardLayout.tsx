import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { prisma } from '@/lib/prisma'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    name: string
    role: string
    photo: string | null
  }
  pageTitle: string
}

function darkenHexColor(hex: string, percent: number): string {
  try {
    let num = parseInt(hex.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
  } catch {
    return '#b71c1c';
  }
}

export async function DashboardLayout({ children, user, pageTitle }: DashboardLayoutProps) {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ['primary_color', 'app_icon'] } }
  })

  const primaryColor = settings.find(s => s.key === 'primary_color')?.value || '#e31e25'
  const appLogo = settings.find(s => s.key === 'app_icon')?.value || ''
  const redDark = darkenHexColor(primaryColor, 15)

  return (
    <div className="dashboard-layout">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --red: ${primaryColor} !important;
          --red-dark: ${redDark} !important;
          --red-light: ${primaryColor}10 !important;
          --red-glow: ${primaryColor}25 !important;
          --shadow-red: 0 4px 14px ${primaryColor}40 !important;
        }
      `}} />
      <Sidebar user={user} appLogo={appLogo} />
      <Navbar user={user} pageTitle={pageTitle} />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
