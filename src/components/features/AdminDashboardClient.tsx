'use client'

import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface StatProps {
  totalComps: number
  activeStudents: number
  activeParticipations: number
  totalJuara: number
}

interface LevelEntry {
  name: string
  count: number
}

interface MonthlyEntry {
  month: string
  pendaftaran: number
  prestasi: number
}

interface Props {
  stats: StatProps
  levelData: LevelEntry[]
  monthlyStats: MonthlyEntry[]
}

export function AdminDashboardClient({ stats, levelData, monthlyStats }: Props) {
  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #1a1a2e, #111122)', boxShadow: 'var(--shadow)' }}>
        <div className="welcome-banner-content">
          <div className="welcome-banner-greeting">🔑 Panel Kontrol Utama,</div>
          <h2>Administrator PUSTASDA</h2>
          <p className="welcome-banner-quote">Pantau metrik aktivitas pendaftaran lomba, kelola data pengguna, serta rekap pencapaian prestasi akademik siswa.</p>

          <div className="welcome-banner-stats">
            <div className="welcome-stat">
              <i className="fa-solid fa-trophy text-red"></i>
              <span className="welcome-stat-value">{stats.totalComps}</span> Lomba Terposting
            </div>
            <div className="welcome-stat">
              <i className="fa-solid fa-user-graduate"></i>
              <span className="welcome-stat-value">{stats.activeStudents}</span> Siswa Terdaftar
            </div>
            <div className="welcome-stat">
              <i className="fa-solid fa-arrow-trend-up text-blue"></i>
              <span className="welcome-stat-value">{stats.activeParticipations}</span> Partisipasi Aktif
            </div>
            <div className="welcome-stat">
              <i className="fa-solid fa-award text-yellow"></i>
              <span className="welcome-stat-value">{stats.totalJuara}</span> Koleksi Prestasi Juara
            </div>
          </div>
        </div>
        <div className="welcome-banner-image" style={{ fontSize: '5rem' }}>💻</div>
      </div>

      {/* Grid of graphs */}
      <div className="bento-grid bento-2" style={{ marginBottom: '28px' }}>
        {/* Line Chart: Pendaftaran vs Prestasi */}
        <div className="chart-container">
          <div className="chart-title">
            <i className="fa-solid fa-chart-line text-red"></i> Tren Partisipasi &amp; Prestasi (6 Bulan Terakhir)
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-light)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line name="Pendaftaran Lomba" type="monotone" dataKey="pendaftaran" stroke="var(--blue)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line name="Siswa Meraih Juara" type="monotone" dataKey="prestasi" stroke="var(--red)" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '90px', color: 'var(--gray)' }}>Belum ada data bulanan.</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Cakupan Tingkat Lomba */}
        <div className="chart-container">
          <div className="chart-title">
            <i className="fa-solid fa-chart-bar text-blue"></i> Penyebaran Cakupan Tingkat Kompetisi
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {levelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-light)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar name="Banyak Lomba" dataKey="count" fill="var(--red)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '90px', color: 'var(--gray)' }}>Belum ada data cakupan lomba.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
