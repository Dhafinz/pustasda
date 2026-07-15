import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'PUSTASDA — Pusat Prestasi SMK Telkom Sidoarjo',
  description: 'Platform manajemen prestasi siswa SMK Telkom Sidoarjo. Kelola lomba, tim, bimbingan, dan raih prestasi maksimal.',
  keywords: 'pustasda, prestasi, smk telkom, sidoarjo, lomba, kompetisi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
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
