'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CompCard } from '@/components/ui/CompCard'

interface CompData {
  id: number
  title: string
  organizer: string
  level: string
  type: string
  deadline: string
  poster: string | null
  category: { name: string; color: string; icon: string }
}

interface LeaderboardEntry {
  id: number
  name: string
  kelas: string
  jurusan: string
  poin: number
  juara: number
  lomba: number
  isYou: boolean
}

interface Props {
  userName: string
  stats: { lombaIkuti: number; kaliJuara: number; notifBaru: number }
  quote: string
  trendingComps: CompData[]
  nasionalComps: CompData[]
  newestComps: CompData[]
  deadlineSoonComps: CompData[]
  allComps: CompData[]
  totalComps: number
  leaderboard: LeaderboardEntry[]
}

type CategoryTab = 'tren' | 'nasional' | 'terbaru' | 'deadline'

export function StudentBerandaClient({
  userName, stats, quote, trendingComps, nasionalComps, newestComps, deadlineSoonComps,
  allComps, totalComps, leaderboard
}: Props) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('tren')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const compsPerPage = 10

  const categoryTabs = [
    { key: 'tren' as const, label: 'Lomba Tren', icon: 'fa-fire', desc: 'Paling diminati sekarang', color: '#e31e25', bgColor: '#fff3f3' },
    { key: 'nasional' as const, label: 'Lomba Nasional', icon: 'fa-flag', desc: 'Tingkat seluruh Indonesia', color: '#FF9800', bgColor: '#fff8ec' },
    { key: 'terbaru' as const, label: 'Lomba Terbaru', icon: 'fa-clock-rotate-left', desc: 'Baru saja ditambahkan', color: '#2196F3', bgColor: '#eff6ff' },
    { key: 'deadline' as const, label: 'Deadline Dekat', icon: 'fa-hourglass-half', desc: 'Daftar sebelum terlambat', color: '#1a1a2e', bgColor: '#f0f1f3' },
  ]

  const getActiveComps = () => {
    switch (activeTab) {
      case 'tren': return trendingComps
      case 'nasional': return nasionalComps
      case 'terbaru': return newestComps
      case 'deadline': return deadlineSoonComps
    }
  }

  // Filter competitions by search
  const filteredComps = allComps.filter(c =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.organizer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredComps.length / compsPerPage)
  const paginatedComps = filteredComps.slice((currentPage - 1) * compsPerPage, currentPage * compsPerPage)

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-banner-greeting">
            🎉 Selamat datang kembali,
          </div>
          <h2>{userName}</h2>
          <p className="welcome-banner-quote">{quote}</p>
          <div className="welcome-banner-stats">
            <div className="welcome-stat">
              <i className="fa-solid fa-list-check"></i>
              <span className="welcome-stat-value">{stats.lombaIkuti}</span> Lomba Diikuti
            </div>
            <div className="welcome-stat">
              <i className="fa-solid fa-trophy" style={{ color: 'var(--yellow)' }}></i>
              <span className="welcome-stat-value">{stats.kaliJuara}</span> Kali Juara
            </div>
            <div className="welcome-stat">
              <i className="fa-solid fa-bell"></i>
              <span className="welcome-stat-value">{stats.notifBaru}</span> Notif Baru
            </div>
          </div>
        </div>
        <div className="welcome-banner-image">
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '6rem', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))'
          }}>
            🏆
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="section-header">
        <h2 className="section-title">
          <i className="fa-solid fa-th-large"></i> Kategori Lomba
        </h2>
        <Link href="/student/explore" className="card-link">
          Lihat semua <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>

      <div className="bento-grid bento-4" style={{ marginBottom: '28px' }}>
        {categoryTabs.map(tab => (
          <div
            key={tab.key}
            className="category-card"
            onClick={() => setActiveTab(tab.key)}
            style={activeTab === tab.key ? { borderColor: tab.color, boxShadow: `0 4px 20px ${tab.color}25` } : {}}
          >
            <div className="category-card-icon" style={{ background: tab.bgColor, color: tab.color }}>
              <i className={`fa-solid ${tab.icon}`}></i>
            </div>
            <div>
              <div className="category-card-title" style={activeTab === tab.key ? { color: tab.color } : {}}>{tab.label}</div>
              <div className="category-card-desc">{tab.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Category Competitions */}
      {getActiveComps().length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div className="section-header">
            <h2 className="section-title">
              <i className={`fa-solid ${categoryTabs.find(t => t.key === activeTab)?.icon}`}
                 style={{ color: categoryTabs.find(t => t.key === activeTab)?.color }}></i>
              {categoryTabs.find(t => t.key === activeTab)?.label}
            </h2>
          </div>
          <div className="bento-grid bento-4">
            {getActiveComps().slice(0, 4).map(comp => (
              <CompCard 
                key={comp.id} 
                {...comp} 
                onClick={() => router.push(`/student/explore?id=${comp.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ marginBottom: '20px' }}>
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Cari kompetisi berdasarkan nama atau penyelenggara..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          />
          <Link href="/student/explore" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-filter"></i> Filter
          </Link>
        </div>
      </div>

      {/* Main Competition Grid */}
      <div className="section-header">
        <h2 className="section-title">
          <i className="fa-solid fa-grid-2"></i> Semua Lomba
        </h2>
        <span style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>{totalComps} lomba tersedia</span>
      </div>

      {paginatedComps.length > 0 ? (
        <>
          <div className="bento-grid bento-2" style={{ marginBottom: '20px' }}>
            {paginatedComps.map(comp => (
              <CompCard 
                key={comp.id} 
                {...comp} 
                onClick={() => router.push(`/student/explore?id=${comp.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <i className="fa-regular fa-folder-open"></i>
            <h3>Tidak ada kompetisi ditemukan</h3>
            <p>Coba ubah kata kunci pencarian Anda.</p>
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      <div style={{ marginTop: '36px' }}>
        <div className="section-header">
          <h2 className="section-title">
            <i className="fa-solid fa-ranking-star" style={{ color: 'var(--yellow)' }}></i> Leaderboard Siswa Berprestasi
          </h2>
          <Link href="/student/leaderboard" className="card-link">
            Lihat semua <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {leaderboard.length > 0 ? (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Siswa</th>
                  <th style={{ textAlign: 'right' }}>Poin</th>
                  <th style={{ textAlign: 'right' }}>Juara</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="leaderboard-rank-badge">
                        {idx === 0 ? <span className="rank-medal">🥇</span> :
                         idx === 1 ? <span className="rank-medal">🥈</span> :
                         idx === 2 ? <span className="rank-medal">🥉</span> :
                         <span style={{ fontWeight: 600 }}>{idx + 1}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="leaderboard-student">
                        <div className="leaderboard-student-avatar">
                          {entry.name.charAt(0)}
                        </div>
                        <div>
                          <div className="leaderboard-student-name">
                            {entry.name}
                            {entry.isYou && <span className="you-badge">Kamu</span>}
                          </div>
                          <div className="leaderboard-student-class">
                            {entry.jurusan} · {entry.kelas}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>
                      {entry.poin}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {entry.juara} <span style={{ color: 'var(--yellow)' }}>juara</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-ranking-star"></i>
              <h3>Belum ada data leaderboard</h3>
              <p>Data akan muncul setelah siswa mengikuti lomba.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-brand">PUSTASDA</div>
        <div className="footer-text">
          Pusat Prestasi SMK Telkom Sidoarjo<br />
          Platform manajemen lomba dan prestasi siswa
        </div>
        <div className="footer-links">
          <Link href="/student">Beranda</Link>
          <Link href="/student/explore">Eksplor</Link>
          <Link href="/student/leaderboard">Leaderboard</Link>
          <Link href="/student/rekapitulasi">Rekapitulasi</Link>
        </div>
      </div>
    </div>
  )
}
