'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Props {
  initialColor: string
  initialIcon: string
}

export function DeveloperSettingsClient({ initialColor, initialIcon }: Props) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [color, setColor] = useState(initialColor)
  const [icon, setIcon] = useState(initialIcon)
  const [saving, setSaving] = useState(false)

  const handleSaveColor = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/developer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'primary_color', value: color })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Warna utama website berhasil diubah di database!', 'success')
        // Instantly update colors in client DOM for immediate visual satisfaction
        try {
          const R = parseInt(color.substring(1, 3), 16)
          const G = parseInt(color.substring(3, 5), 16)
          const B = parseInt(color.substring(5, 7), 16)
          const dR = Math.max(0, R - 25)
          const dG = Math.max(0, G - 25)
          const dB = Math.max(0, B - 25)
          const darkColor = `#${dR.toString(16).padStart(2, '0')}${dG.toString(16).padStart(2, '0')}${dB.toString(16).padStart(2, '0')}`
          
          document.documentElement.style.setProperty('--red', color, 'important')
          document.documentElement.style.setProperty('--red-dark', darkColor, 'important')
          document.documentElement.style.setProperty('--red-light', color + '10', 'important')
        } catch (e) {
          console.error(e)
        }
        router.refresh()
      } else {
        addToast(data.error || 'Gagal mengubah warna', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIcon = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/developer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'app_icon', value: icon })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Icon aplikasi berhasil diperbarui di database!', 'success')
        router.refresh()
      } else {
        addToast(data.error || 'Gagal merubah icon', 'error')
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
          <i className="fa-solid fa-sliders text-red"></i> Pengaturan Aplikasi (Developer)
        </h1>
        <p>Sesuaikan aset warna primer web global serta nama file logo aplikasi pada database.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Color Palette setting */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '14px' }}>
            <i className="fa-solid fa-palette text-red" style={{ marginRight: '6px' }}></i> Warna Utama Website
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <input
              type="color"
              className="form-input"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '60px', height: '48px', padding: '4px', cursor: 'pointer' }}
            />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '0.8rem', display: 'block' }}>Primary Brand Color: {color.toUpperCase()}</strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>Menentukan warna header, sidebar item active, dan primary buttons global.</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSaveColor} disabled={saving}>
              Terapkan
            </button>
          </div>
        </div>

        {/* Custom Icon Setting */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '14px' }}>
            <i className="fa-solid fa-image text-blue" style={{ marginRight: '6px' }}></i> Aset Icon &amp; Logo (PNG)
          </h3>

          <form onSubmit={handleSaveIcon}>
            <div className="form-group">
              <label className="form-label">Tautan / Nama File Icon Aplikasi</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="default-logo.png"
                  required
                  style={{ flex: 1 }}
                />
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', height: '38px', gap: '6px', margin: 0, whiteSpace: 'nowrap' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload Logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const fd = new FormData()
                      fd.append('file', file)
                      addToast('Mengunggah logo...', 'info')
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: fd })
                        const data = await res.json()
                        if (res.ok) {
                          setIcon(data.url)
                          addToast('Logo berhasil diunggah! Klik "Update Nama Icon" untuk menyimpan ke database.', 'success')
                        } else {
                          addToast(data.error || 'Gagal unggah', 'error')
                        }
                      } catch {
                        addToast('Koneksi terganggu', 'error')
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                Update Nama Icon
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
