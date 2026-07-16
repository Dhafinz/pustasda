'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface NavbarProps {
  user: {
    name: string
    role: string
    photo: string | null
  }
  pageTitle: string
}

export function Navbar({ user, pageTitle }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.charAt(0) || ''
    const second = parts[1]?.charAt(0) || ''
    return (first + second).toUpperCase() || 'U'
  }
  const initials = getInitials(user.name)
  const displayRole = user.role === 'student' ? 'Siswa' :
    user.role === 'teacher' ? 'Guru' :
    user.role === 'developer' ? 'Developer' : 'Admin'

  const dashboardPath = `/${user.role === 'student' ? 'student' : user.role === 'teacher' ? 'teacher' : user.role === 'admin' ? 'admin' : 'developer'}`

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem('pustasda-theme') || 'light'
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotifClick = async (notif: any) => {
    try {
      // Fire-and-forget the read API call so redirect is instant and reliable
      fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' }).catch((err) => console.error(err))
      
      setNotifications(prev => prev.filter(n => n.id !== notif.id))
      setNotifOpen(false)
      
      let targetPath = dashboardPath
      if (user.role === 'student') {
        targetPath = '/student/participations'
      } else if (user.role === 'teacher') {
        if (notif.type === 'mentorship_request') {
          targetPath = '/teacher/inbox'
        } else {
          targetPath = '/teacher/bimbingan'
        }
      } else if (user.role === 'admin') {
        targetPath = '/admin/monitoring'
      }
      window.location.href = targetPath
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' })
      if (res.ok) {
        setNotifications([])
        setNotifOpen(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <nav className="navbar">
      <span className="navbar-title">{pageTitle}</span>

      <div className="navbar-actions">
        {/* Notifications Bell Dropdown */}
        <div className="navbar-user-dropdown" ref={notifRef}>
          <button 
            className="navbar-btn" 
            title="Notifikasi"
            onClick={() => setNotifOpen(!notifOpen)}
            style={{ position: 'relative' }}
          >
            <i className="fa-solid fa-bell"></i>
            {notifications.length > 0 && <span className="badge-dot" style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: 'var(--red)', borderRadius: '50%' }}></span>}
          </button>

          {notifOpen && (
            <div className="navbar-dropdown" style={{ width: '280px', right: 0 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--gray-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem' }}>Notifikasi</strong>
                {notifications.length > 0 && (
                  <button onClick={handleMarkAllRead} style={{ fontSize: '0.68rem', color: 'var(--red)', background: 'none', border: 'none', fontWeight: 600 }}>
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '4px 0' }}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotifClick(n)}
                      style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.03)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                      className="navbar-dropdown-item-custom"
                    >
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${n.color || 'var(--red)'}15`, color: n.color || 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0, marginTop: '2px' }}>
                        <i className={`fa-solid ${n.icon || 'fa-bell'}`}></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--gray)', marginTop: '2px', lineHeight: 1.3 }}>{n.body}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--gray)', fontSize: '0.72rem' }}>
                    <i className="fa-regular fa-bell-slash" style={{ fontSize: '1.2rem', display: 'block', marginBottom: '8px', opacity: 0.5 }}></i>
                    Tidak ada notifikasi baru
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Dropdown */}
        <div className="navbar-user-dropdown" ref={dropdownRef}>
          <div
            className="navbar-user"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="navbar-user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.photo && user.photo !== 'default-avatar.png' && user.photo !== 'default_avatar.png' ? (
                <img src={user.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <span className="navbar-user-name">{user.name}</span>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.6rem', color: 'var(--gray)' }}></i>
          </div>

          {dropdownOpen && (
            <div className="navbar-dropdown">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--gray-light)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{displayRole}</div>
              </div>
              <div style={{ padding: '4px 0' }}>
                <Link href={`${dashboardPath}/settings/profile`} className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <i className="fa-solid fa-user-gear"></i> Pengaturan Profil
                </Link>
                <div className="navbar-dropdown-divider"></div>
                <button
                  className="navbar-dropdown-item danger"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
