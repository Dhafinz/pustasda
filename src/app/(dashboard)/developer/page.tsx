import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import os from 'os'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'

export default async function DeveloperDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'developer') redirect('/login')

  // Fetch db statistics
  const userCount = await prisma.user.count()
  const compCount = await prisma.competition.count()
  const partCount = await prisma.participation.count()
  const logCount = await prisma.activityLog.count()

  // Fetch recent activity logs
  const logs = await prisma.activityLog.findMany({
    include: {
      user: { select: { name: true, role: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // System Stats
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
    freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
    nodeVersion: process.version
  }

  return (
    <DashboardLayout user={session.user} pageTitle="System Stats">
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>
            <i className="fa-solid fa-server text-red"></i> Status Sistem &amp; Database
          </h1>
          <p>Tinjauan konsumsi memori server, jumlah record tabel database Prisma ORM, serta pencatatan audit log aktivitas.</p>
        </div>

        {/* DB counts grid */}
        <div className="recap-stat-grid" style={{ marginBottom: '24px' }}>
          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
              <i className="fa-solid fa-database"></i>
            </div>
            <div>
              <div className="recap-stat-value">{userCount}</div>
              <div className="recap-stat-label">Tabel users (Pengguna)</div>
            </div>
          </div>

          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--yellow-light)', color: 'var(--yellow)' }}>
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div>
              <div className="recap-stat-value">{compCount}</div>
              <div className="recap-stat-label">Tabel competitions (Lomba)</div>
            </div>
          </div>

          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <div className="recap-stat-value">{partCount}</div>
              <div className="recap-stat-label">Tabel participations (Partisipasi)</div>
            </div>
          </div>

          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <div className="recap-stat-value">{logCount}</div>
              <div className="recap-stat-label">Tabel activity_logs (Audit Log)</div>
            </div>
          </div>
        </div>

        {/* OS Stats */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '14px' }}>
            <i className="fa-solid fa-microchip text-blue" style={{ marginRight: '6px' }}></i> Informasi Lingkungan Server
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>SYSTEM PLATFORM</span>
              <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px', textTransform: 'capitalize' }}>{systemInfo.platform} ({systemInfo.arch})</strong>
            </div>
            <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>NODE RUNTIME</span>
              <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>{systemInfo.nodeVersion}</strong>
            </div>
            <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>TOTAL RAM</span>
              <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>{systemInfo.totalMemory}</strong>
            </div>
            <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>FREE RAM</span>
              <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>{systemInfo.freeMemory}</strong>
            </div>
            <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>DB DRIVER</span>
              <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>Prisma SQLite</strong>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-light)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800 }}>Audit Logs Aktivitas Pengguna (10 Terbaru)</h3>
          </div>

          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Waktu Kejadian</th>
                <th>Pengguna</th>
                <th>Aksi Modul</th>
                <th>Deskripsi Log</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                    {log.createdAt.toLocaleDateString('id-ID')} {log.createdAt.toLocaleTimeString('id-ID')}
                  </td>
                  <td>
                    <div>
                      <strong style={{ fontSize: '0.8rem', display: 'block' }}>{log.user?.name || 'System Guest'}</strong>
                      <span style={{ fontSize: '0.65rem', color: 'var(--gray)', textTransform: 'capitalize' }}>Role: {log.user?.role || 'Guest'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-pill badge-gray" style={{ textTransform: 'uppercase', fontSize: '0.62rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--gray-dark)' }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ChatbotFAB />
    </DashboardLayout>
  )
}
