'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarUser {
  name: string
  role: string
  photo: string | null
}

export function Sidebar({ user, appLogo }: { user: SidebarUser, appLogo?: string }) {
  const pathname = usePathname()
  const role = user.role
  const [settingsOpen, setSettingsOpen] = useState(false)

  const displayRole = role === 'student' ? 'Siswa' :
    role === 'teacher' ? 'Guru' :
      role === 'developer' ? 'Developer' : 'Admin'

  const displaySubRole = role === 'student' ? '📚 Umum' :
    role === 'teacher' ? '📖 Guru Produktif' :
      role === 'developer' ? '💻 Web Developer' : '🔑 Administrator'

  const isActive = (path: string) => pathname === path ? 'active' : ''
  const isActivePrefix = (path: string) => pathname.startsWith(path) ? 'active' : ''

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.charAt(0) || ''
    const second = parts[1]?.charAt(0) || ''
    return (first + second).toUpperCase() || 'U'
  }
  const initials = getInitials(user.name)

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        {appLogo ? (
          <img
            src={appLogo.startsWith('/') || appLogo.startsWith('http') ? appLogo : `/images/${appLogo}`}
            alt="logo"
            style={{ maxHeight: '32px', maxWidth: '32px', borderRadius: '4px', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="sidebar-logo-placeholder">P</div>
        )}
        <span className="sidebar-brand">Pustasda</span>
      </div>

      {/* Student Menu */}
      {role === 'student' && (
        <>
          <div className="sidebar-section">
            <Link href="/student" className={`sidebar-nav-item ${isActive('/student')}`}>
              <i className="fa-solid fa-house"></i> Beranda
            </Link>

            {/* Pengaturan Dropdown */}
            <div className="sidebar-dropdown">
              <button
                className={`sidebar-dropdown-toggle ${settingsOpen ? 'open' : ''}`}
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <i className="fa-solid fa-gear"></i> Pengaturan
                <i className="fa-solid fa-chevron-down"></i>
              </button>
              <div className={`sidebar-dropdown-menu ${settingsOpen ? 'open' : ''}`}>
                <Link href="/student/settings/profile" className={`sidebar-nav-item ${isActivePrefix('/student/settings/profile')}`}>
                  <i className="fa-solid fa-user-pen"></i> Profil
                </Link>
                <Link href="/student/settings/quiz" className={`sidebar-nav-item ${isActivePrefix('/student/settings/quiz')}`}>
                  <i className="fa-solid fa-brain"></i> Kuis Karakter
                </Link>
                <Link href="/student/settings/preferences" className={`sidebar-nav-item ${isActivePrefix('/student/settings/preferences')}`}>
                  <i className="fa-solid fa-sliders"></i> Preferensi
                </Link>
              </div>
            </div>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <span className="sidebar-label">Lomba</span>
            <Link href="/student/explore" className={`sidebar-nav-item ${isActivePrefix('/student/explore')}`}>
              <i className="fa-solid fa-compass"></i> Eksplor Lomba
            </Link>
            <Link href="/student/participations" className={`sidebar-nav-item ${isActivePrefix('/student/participations')}`}>
              <i className="fa-solid fa-bookmark"></i> Lomba Saya
            </Link>
            <Link href="/student/rekapitulasi" className={`sidebar-nav-item ${isActivePrefix('/student/rekapitulasi')}`}>
              <i className="fa-solid fa-chart-simple"></i> Rekapitulasi
            </Link>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <Link href="/student/leaderboard" className={`sidebar-nav-item ${isActive('/student/leaderboard')}`}>
              <i className="fa-solid fa-ranking-star"></i> Leaderboard
            </Link>
          </div>
        </>
      )}

      {/* Teacher Menu */}
      {role === 'teacher' && (
        <>
          <div className="sidebar-section">
            <Link href="/teacher" className={`sidebar-nav-item ${isActive('/teacher')}`}>
              <i className="fa-solid fa-house"></i> Dashboard
            </Link>

            <div className="sidebar-dropdown">
              <button
                className={`sidebar-dropdown-toggle ${settingsOpen ? 'open' : ''}`}
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <i className="fa-solid fa-gear"></i> Pengaturan
                <i className="fa-solid fa-chevron-down"></i>
              </button>
              <div className={`sidebar-dropdown-menu ${settingsOpen ? 'open' : ''}`}>
                <Link href="/teacher/settings/profile" className={`sidebar-nav-item ${isActivePrefix('/teacher/settings/profile')}`}>
                  <i className="fa-solid fa-user-pen"></i> Profil
                </Link>
                <Link href="/teacher/settings/preferences" className={`sidebar-nav-item ${isActivePrefix('/teacher/settings/preferences')}`}>
                  <i className="fa-solid fa-sliders"></i> Preferensi
                </Link>
              </div>
            </div>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <span className="sidebar-label">Lomba</span>
            <Link href="/teacher/explore" className={`sidebar-nav-item ${isActivePrefix('/teacher/explore')}`}>
              <i className="fa-solid fa-compass"></i> Eksplor Lomba
            </Link>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <span className="sidebar-label">Bimbingan</span>
            <Link href="/teacher/bimbingan" className={`sidebar-nav-item ${isActivePrefix('/teacher/bimbingan')}`}>
              <i className="fa-solid fa-chalkboard-user"></i> Bimbingan
            </Link>
            <Link href="/teacher/inbox" className={`sidebar-nav-item ${isActivePrefix('/teacher/inbox')}`}>
              <i className="fa-solid fa-inbox"></i> Kotak Masuk
            </Link>
            <Link href="/teacher/search-student" className={`sidebar-nav-item ${isActivePrefix('/teacher/search-student')}`}>
              <i className="fa-solid fa-magnifying-glass"></i> Cari Siswa
            </Link>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <Link href="/teacher/rekapitulasi" className={`sidebar-nav-item ${isActivePrefix('/teacher/rekapitulasi')}`}>
              <i className="fa-solid fa-chart-simple"></i> Rekapitulasi
            </Link>
          </div>
        </>
      )}

      {/* Admin Menu */}
      {role === 'admin' && (
        <>
          <div className="sidebar-section">
            <Link href="/admin" className={`sidebar-nav-item ${isActive('/admin')}`}>
              <i className="fa-solid fa-chart-pie"></i> Dashboard
            </Link>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <span className="sidebar-label">Manajemen</span>
            <Link href="/admin/users" className={`sidebar-nav-item ${isActivePrefix('/admin/users')}`}>
              <i className="fa-solid fa-users-gear"></i> Manajemen User
            </Link>
            <Link href="/admin/competitions" className={`sidebar-nav-item ${isActivePrefix('/admin/competitions')}`}>
              <i className="fa-solid fa-trophy"></i> Manajemen Lomba
            </Link>
            <Link href="/admin/categories" className={`sidebar-nav-item ${isActivePrefix('/admin/categories')}`}>
              <i className="fa-solid fa-tags"></i> Kategori & Bidang
            </Link>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <span className="sidebar-label">Monitoring</span>
            <Link href="/admin/monitoring" className={`sidebar-nav-item ${isActivePrefix('/admin/monitoring')}`}>
              <i className="fa-solid fa-desktop"></i> Kegiatan Bimbingan
            </Link>
            <Link href="/admin/leaderboard" className={`sidebar-nav-item ${isActivePrefix('/admin/leaderboard')}`}>
              <i className="fa-solid fa-ranking-star"></i> Leaderboard
            </Link>
          </div>
        </>
      )}

      {/* Developer Menu */}
      {role === 'developer' && (
        <>
          <div className="sidebar-section">
            <Link href="/developer" className={`sidebar-nav-item ${isActive('/developer')}`}>
              <i className="fa-solid fa-server"></i> System Stats
            </Link>
          </div>

          <div className="sidebar-divider"></div>

          <div className="sidebar-section">
            <span className="sidebar-label">Tools</span>
            <Link href="/developer/settings" className={`sidebar-nav-item ${isActivePrefix('/developer/settings')}`}>
              <i className="fa-solid fa-sliders"></i> Pengaturan App
            </Link>
            <Link href="/developer/bugs" className={`sidebar-nav-item ${isActivePrefix('/developer/bugs')}`}>
              <i className="fa-solid fa-bug"></i> Bug Analysis
            </Link>
          </div>
        </>
      )}

      {/* User Card (Bottom) */}
      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="su-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.photo && user.photo !== 'default-avatar.png' && user.photo !== 'default_avatar.png' ? (
              <img src={user.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div className="su-info">
            <div className="su-name">{user.name}</div>
            <div className="su-role">{displaySubRole}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
