import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'

export default async function TeacherRekapitulasiPage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  const teacherId = parseInt(session.user.id)

  // Fetch mentorship statistics
  const mentorships = await prisma.mentorship.findMany({
    where: { teacherId },
    include: {
      participation: {
        include: {
          user: true,
          competition: {
            include: { category: true }
          }
        }
      }
    }
  })

  const totalBimbingan = mentorships.length
  const pendingRequests = mentorships.filter((m) => m.status === 'pending').length
  const activeBimbingan = mentorships.filter((m) => m.status === 'accepted').length
  const completedBimbingan = mentorships.filter((m) => m.participation.status === 'completed')

  const totalJuara = mentorships.filter((m) =>
    ['juara_1', 'juara_2', 'juara_3', 'juara_harapan'].includes(m.participation.result)
  ).length

  return (
    <DashboardLayout user={session.user} pageTitle="Rekapitulasi Bimbingan">
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>
            <i className="fa-solid fa-chart-simple text-red"></i> Rekapitulasi Bimbingan Guru
          </h1>
          <p>Tinjau total data bimbingan, rasio persetujuan pengajuan, serta tingkat kemenangan siswa binaan Anda.</p>
        </div>

        {/* Recap stat cards */}
        <div className="recap-stat-grid" style={{ marginBottom: '24px' }}>
          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div className="recap-stat-value">{totalBimbingan}</div>
              <div className="recap-stat-label">Total Pengajuan Bimbingan</div>
            </div>
          </div>

          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--yellow-light)', color: 'var(--yellow)' }}>
              <i className="fa-solid fa-hourglass-half"></i>
            </div>
            <div>
              <div className="recap-stat-value">{pendingRequests}</div>
              <div className="recap-stat-label">Pengajuan Menunggu ACC</div>
            </div>
          </div>

          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div className="recap-stat-value">{activeBimbingan}</div>
              <div className="recap-stat-label">Bimbingan Aktif Saat Ini</div>
            </div>
          </div>

          <div className="recap-stat">
            <div className="recap-stat-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div>
              <div className="recap-stat-value">{totalJuara}</div>
              <div className="recap-stat-label">Siswa Meraih Juara</div>
            </div>
          </div>
        </div>

        {/* Detailed Guided List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-light)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800 }}>Daftar Lengkap Riwayat Bimbingan</h3>
          </div>

          {mentorships.length > 0 ? (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Siswa Bimbingan</th>
                  <th>Nama Kompetisi</th>
                  <th>Tingkat</th>
                  <th>Status Pendampingan</th>
                  <th style={{ textAlign: 'right' }}>Hasil Lomba</th>
                </tr>
              </thead>
              <tbody>
                {mentorships.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.82rem', display: 'block' }}>{m.participation.user.name}</strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>{m.participation.user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontSize: '0.62rem', background: `${m.participation.competition.category.color}15`, color: m.participation.competition.category.color, padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginBottom: '2px' }}>
                          {m.participation.competition.category.name}
                        </span>
                        <strong style={{ fontSize: '0.8rem', display: 'block' }}>{m.participation.competition.title}</strong>
                      </div>
                    </td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 600 }}>{m.participation.competition.level}</td>
                    <td>
                      {m.status === 'accepted' ? (
                        <span className="badge-pill badge-green">Aktif Membimbing</span>
                      ) : m.status === 'pending' ? (
                        <span className="badge-pill badge-yellow">Pending</span>
                      ) : (
                        <span className="badge-pill badge-red">Ditolak</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {m.participation.result.replace('juara_', 'Juara ').toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <i className="fa-solid fa-graduation-cap" style={{ fontSize: '3rem' }}></i>
              <h3>Belum ada riwayat bimbingan</h3>
              <p>Pengajuan dan riwayat bimbingan kompetisi siswa binaan Anda akan tercatat di sini.</p>
            </div>
          )}
        </div>
      </div>
      <ChatbotFAB />
    </DashboardLayout>
  )
}
