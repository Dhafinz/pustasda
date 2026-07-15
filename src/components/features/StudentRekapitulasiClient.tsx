'use client'

import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

interface StatProps {
  totalLomba: number
  totalJuara: number
  totalSubmit: number
  totalSelesai: number
}

interface CategoryEntry {
  name: string
  value: number
  color: string
}

interface FieldEntry {
  name: string
  count: number
}

interface MonthlyEntry {
  month: string
  count: number
  submitCount: number
}

interface Props {
  stats: StatProps
  categoryData: CategoryEntry[]
  fieldData: FieldEntry[]
  monthlyData: MonthlyEntry[]
  aiSummary: string
}

export function StudentRekapitulasiClient({
  stats,
  categoryData,
  fieldData,
  monthlyData,
  aiSummary
}: Props) {
  // Pie chart default colors if empty
  const COLORS = ['#e31e25', '#FF9800', '#2196F3', '#4CAF50', '#9C27B0', '#00BCD4']

  return (
    <div className="animate-fade-in">
      {/* Header Title */}
      <div className="page-header">
        <h1>
          <i className="fa-solid fa-chart-simple text-red"></i> Rekapitulasi Prestasi
        </h1>
        <p>Pantau semua perkembangan aktivitas lomba, pengiriman karya, serta rasio raihan juara Anda.</p>
      </div>

      {/* Recapitulation Stat Grid */}
      <div className="recap-stat-grid">
        <div className="recap-stat">
          <div className="recap-stat-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
            <i className="fa-solid fa-trophy"></i>
          </div>
          <div>
            <div className="recap-stat-value">{stats.totalLomba}</div>
            <div className="recap-stat-label">Total Lomba Diikuti</div>
          </div>
        </div>

        <div className="recap-stat">
          <div className="recap-stat-icon" style={{ background: 'var(--yellow-light)', color: 'var(--yellow)' }}>
            <i className="fa-solid fa-medal"></i>
          </div>
          <div>
            <div className="recap-stat-value">{stats.totalJuara}</div>
            <div className="recap-stat-label">Kali Meraih Juara</div>
          </div>
        </div>

        <div className="recap-stat">
          <div className="recap-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
          <div>
            <div className="recap-stat-value">{stats.totalSubmit}</div>
            <div className="recap-stat-label">Karya Disubmit</div>
          </div>
        </div>

        <div className="recap-stat">
          <div className="recap-stat-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
            <i className="fa-solid fa-flag"></i>
          </div>
          <div>
            <div className="recap-stat-value">{stats.totalSelesai}</div>
            <div className="recap-stat-label">Lomba Selesai</div>
          </div>
        </div>
      </div>

      {/* AI Summary Banner Section */}
      <div className="recap-ai-banner">
        <div className="recap-ai-title">
          <i className="fa-solid fa-wand-magic-sparkles"></i> Rekomendasi Minat &amp; Bakat (AI)
        </div>
        <div className="recap-ai-text">{aiSummary}</div>
      </div>

      {/* Charts Grid System */}
      <div className="bento-grid bento-2" style={{ marginBottom: '28px' }}>
        {/* Line Chart: Aktivitas Lomba */}
        <div className="chart-container">
          <div className="chart-title">
            <i className="fa-solid fa-chart-line text-blue"></i> Aktivitas Lomba (6 Bulan Terakhir)
          </div>
          <div style={{ width: '100%', height: 260 }}>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-light)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line name="Diikuti" type="monotone" dataKey="count" stroke="var(--red)" strokeWidth={2} activeDot={{ r: 6 }} />
                  <Line name="Submit" type="monotone" dataKey="submitCount" stroke="var(--blue)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--gray)' }}>Belum ada data bulanan.</div>
            )}
          </div>
        </div>

        {/* Pie Chart: Kategori Lomba */}
        <div className="chart-container">
          <div className="chart-title">
            <i className="fa-solid fa-chart-pie text-red"></i> Distribusi Kategori
          </div>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--gray)' }}>Belum ada kategori lomba.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart: Bidang Lomba */}
      <div className="chart-container" style={{ marginBottom: '28px' }}>
        <div className="chart-title">
          <i className="fa-solid fa-chart-bar text-green"></i> Bidang Kompetisi Terbanyak Diikuti
        </div>
        <div style={{ width: '100%', height: 280 }}>
          {fieldData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar name="Jumlah Lomba" dataKey="count" fill="var(--blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '90px', color: 'var(--gray)' }}>Belum ada data bidang lomba.</div>
          )}
        </div>
      </div>
    </div>
  )
}
