'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

export function TeacherPreferencesClient() {
  const { addToast, ToastContainer } = useToast()
  const [theme, setTheme] = useState('light')
  const [waNotify, setWaNotify] = useState(true)

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

  const handleSave = () => {
    addToast('Preferensi pembimbing berhasil disimpan!', 'success')
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      <ToastContainer />

      <div className="page-header">
        <h1>
          <i className="fa-solid fa-sliders text-red"></i> Preferensi Aplikasi
        </h1>
        <p>Atur visual tema serta integrasi notifikasi bimbingan Anda.</p>
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

        {/* Whatsapp Alerts */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '16px' }}>
            <i className="fa-solid fa-bell text-yellow" style={{ marginRight: '6px' }}></i> Integrasi Notifikasi
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--dark)' }}>Notifikasi WhatsApp (Fonnte API)</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>Kirim notifikasi pesan otomatis ke WhatsApp saat siswa mengajukan bimbingan.</span>
            </div>
            <input
              type="checkbox"
              checked={waNotify}
              onChange={(e) => setWaNotify(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--red)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary animate-slide-up" onClick={handleSave}>
            Simpan Preferensi
          </button>
        </div>
      </div>
    </div>
  )
}
