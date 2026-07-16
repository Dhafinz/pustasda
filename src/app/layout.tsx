import type { Metadata } from 'next'
import Script from 'next/script'
import { prisma } from '@/lib/prisma'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pustasda',
  description: 'Platform manajemen prestasi siswa SMK Telkom Sidoarjo. Kelola lomba, tim, bimbingan, dan raih prestasi maksimal.',
  keywords: 'pustasda, prestasi, smk telkom, sidoarjo, lomba, kompetisi',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await prisma.appSetting.findMany({
    where: { key: { in: ['primary_color', 'app_icon'] } }
  })
  const primaryColor = settings.find(s => s.key === 'primary_color')?.value || '#e31e25'
  const appIcon = settings.find(s => s.key === 'app_icon')?.value || '/favicon.ico'
  const redDark = darkenHexColor(primaryColor, 15)
  const appIconUrl = appIcon.startsWith('/') || appIcon.startsWith('http') ? appIcon : `/uploads/${appIcon}`

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href={appIconUrl} />
        <link rel="shortcut icon" href={appIconUrl} />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --red: ${primaryColor} !important;
            --red-dark: ${redDark} !important;
            --red-light: ${primaryColor}10 !important;
            --red-glow: ${primaryColor}25 !important;
            --shadow-red: 0 4px 14px ${primaryColor}40 !important;
          }
        `}} />
        <Script id="theme-loader">
          {`
            (function() {
              try {
                const theme = localStorage.getItem('pustasda-theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark-theme');
                } else {
                  document.documentElement.classList.remove('dark-theme');
                }
              } catch (e) {}
            })()
          `}
        </Script>
      </head>
      <body className="theme-init-placeholder" suppressHydrationWarning>{children}</body>
    </html>
  )
}
