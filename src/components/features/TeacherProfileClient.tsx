'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface TeacherProfileData {
  name: string
  email: string
  waNumber: string
  nip: string
  bidangKeahlian: string
  jabatan: string
  photo: string
}

export function TeacherProfileClient({ initialData }: { initialData: TeacherProfileData }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState(initialData)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          waNumber: formData.waNumber,
          bidangKeahlian: formData.bidangKeahlian,
          photo: formData.photo
        })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Profil guru berhasil diperbarui!', 'success')
        router.refresh()
      } else {
        addToast(data.error || 'Gagal menyimpan profil', 'error')
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
          <i className="fa-solid fa-user-pen text-red"></i> Profil Pembimbing
        </h1>
        <p>Kelola data personal Anda sebagai guru pembimbing prestasi akademik sekolah.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Profile Picture Upload Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--gray-light)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gray-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--gray-mid)' }}>
              {formData.photo && formData.photo !== 'default-avatar.png' && formData.photo !== 'default_avatar.png' ? (
                <img src={formData.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                formData.name.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || 'U'
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Foto Profil</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '28px', padding: '0 12px' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 1024 * 1024) {
                          addToast('Ukuran file maksimal 1MB!', 'error')
                          return
                        }
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setFormData({ ...formData, photo: reader.result as string })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                {formData.photo && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ height: '28px', padding: '0 12px', color: 'var(--red)', borderColor: 'var(--red)' }}
                    onClick={() => setFormData({ ...formData, photo: '' })}
                  >
                    Hapus
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>Format JPG/PNG/WebP, Maksimal 1MB</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nomor Induk Pegawai (NIP)</label>
              <input type="text" className="form-input" value={formData.nip} disabled style={{ background: 'var(--gray-light)', cursor: 'not-allowed' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Jabatan Struktural</label>
              <input type="text" className="form-input" value={formData.jabatan} disabled style={{ background: 'var(--gray-light)', cursor: 'not-allowed' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap &amp; Gelar</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Email Instansi</label>
            <input type="email" className="form-input" value={formData.email} disabled style={{ background: 'var(--gray-light)', cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor WhatsApp Aktif</label>
            <input
              type="text"
              className="form-input"
              value={formData.waNumber}
              onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
              placeholder="Contoh: 6281234567890"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bidang Keahlian / Kompetensi Produktif</label>
            <input
              type="text"
              className="form-input"
              value={formData.bidangKeahlian}
              onChange={(e) => setFormData({ ...formData, bidangKeahlian: e.target.value })}
              placeholder="Contoh: Rekayasa Perangkat Lunak, Multimedia, Jaringan..."
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
