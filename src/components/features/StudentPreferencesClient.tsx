'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Prefs {
  privacyProfile: string
  allowTeamInvite: boolean
  notificationPref: string
}

export function StudentPreferencesClient({ initialPreferences }: { initialPreferences: Prefs }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [privacy, setPrivacy] = useState(initialPreferences.privacyProfile)
  const [allowInvite, setAllowInvite] = useState(initialPreferences.allowTeamInvite)
  const [notif, setNotif] = useState(initialPreferences.notificationPref)
  const [theme, setTheme] = useState('light')

  // Read saved theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pustasda-theme') || 'light'
    setTheme(saved)
  }, [])

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('pustasda-theme', newTheme)
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  }

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacyProfile: privacy,
          allowTeamInvite: allowInvite,
          notificationPref: notif
        })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Preferensi berhasil disimpan!', 'success')
        router.refresh()
      } else {
        addToast(data.error || 'Gagal menyimpan preferensi', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      <ToastContainer />

      <div className="page-header">
        <h1>
          <i className="fa-solid fa-sliders text-red"></i> Preferensi Aplikasi
        </h1>
        <p>Atur privasi profil, ketentuan undangan tim, dan pengaturan notifikasi Anda.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Theme Settings */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px' }}>
            <i className="fa-solid fa-palette text-red" style={{ marginRight: '6px' }}></i> Tema &amp; Tampilan Warna
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              onClick={() => { applyTheme('light'); addToast('Tema default diaktifkan!', 'success') }}
              style={{
                border: theme === 'light' ? '2px solid var(--red)' : '1.5px solid var(--gray-mid)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                cursor: 'pointer',
                background: 'var(--white)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>🔴⚪</div>
              <strong style={{ fontSize: '0.78rem' }}>Default Merah Putih</strong>
            </div>

            <div
              onClick={() => { applyTheme('dark'); addToast('Tema gelap diaktifkan!', 'success') }}
              style={{
                border: theme === 'dark' ? '2px solid var(--red)' : '1.5px solid var(--gray-mid)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                cursor: 'pointer',
                background: 'var(--dark-mid)',
                color: 'var(--white)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>⚫🌑</div>
              <strong style={{ fontSize: '0.78rem' }}>Sleek Dark Mode</strong>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '16px' }}>
            <i className="fa-solid fa-shield-halved text-blue" style={{ marginRight: '6px' }}></i> Privasi &amp; Keanggotaan
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--dark)' }}>Privasi Profil</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>Izinkan profil siswa Anda dilihat oleh siswa lain.</span>
              </div>
              <select className="form-select" value={privacy} onChange={(e) => setPrivacy(e.target.value)} style={{ width: '120px', padding: '6px 10px', fontSize: '0.78rem' }}>
                <option value="public">Publik</option>
                <option value="private">Privat</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--gray-light)' }}>
              <div>
                <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--dark)' }}>Undangan Tim</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>Izinkan siswa lain mengundang Anda ke dalam tim kelompok.</span>
              </div>
              <input
                type="checkbox"
                checked={allowInvite}
                onChange={(e) => setAllowInvite(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--red)' }}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '16px' }}>
            <i className="fa-solid fa-bell text-yellow" style={{ marginRight: '6px' }}></i> Notifikasi &amp; Alert
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--dark)' }}>Frekuensi Pemberitahuan</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>Jenis notifikasi masuk ke web/WA yang ingin diterima.</span>
            </div>
            <select className="form-select" value={notif} onChange={(e) => setNotif(e.target.value)} style={{ width: '150px', padding: '6px 10px', fontSize: '0.78rem' }}>
              <option value="all">Semua Info Lomba</option>
              <option value="important">Hanya Penting/Bimbingan</option>
              <option value="none">Matikan Notifikasi</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary animate-slide-up" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Semua Preferensi'}
          </button>
        </div>
      </div>
    </div>
  )
}
