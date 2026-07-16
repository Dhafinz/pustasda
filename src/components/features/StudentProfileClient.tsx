'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface ProfileData {
  name: string
  email: string
  waNumber: string
  nis: string
  kelas: string
  jurusan: string
  angkatan: string
  photo: string
}

export function StudentProfileClient({ initialData }: { initialData: ProfileData }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState(initialData)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          waNumber: formData.waNumber,
          kelas: formData.kelas,
          jurusan: formData.jurusan,
          photo: formData.photo
        })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Profil berhasil diperbarui!', 'success')
        router.refresh()
      } else {
        addToast(data.error || 'Gagal menyimpan profil', 'error')
      }
    } catch {
      addToast('Koneksi internet bermasalah', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px' }}>
      <ToastContainer />

      <div className="page-header">
        <h1>
          <i className="fa-solid fa-user-pen text-red"></i> Profil Saya
        </h1>
        <p>Kelola data profil Anda untuk keperluan administrasi dan pencatatan prestasi.</p>
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
              <label className="form-label">Nomor Induk Siswa (NIS)</label>
              <input type="text" className="form-input" value={formData.nis} disabled style={{ background: 'var(--gray-light)', cursor: 'not-allowed' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Tahun Angkatan</label>
              <input type="text" className="form-input" value={formData.angkatan} disabled style={{ background: 'var(--gray-light)', cursor: 'not-allowed' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input type="email" className="form-input" value={formData.email} disabled style={{ background: 'var(--gray-light)', cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor WhatsApp</label>
            <input
              type="text"
              className="form-input"
              value={formData.waNumber}
              onChange={(e) => setFormData({ ...formData, waNumber: e.target.value })}
              placeholder="Contoh: 6281234567890"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Kelas</label>
              <select
                className="form-select"
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
              >
                <option value="">Pilih Kelas...</option>
                <option value="X">X</option>
                <option value="XI">XI</option>
                <option value="XII">XII</option>
                <option value="XIII">XIII</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jurusan</label>
              <select
                className="form-select"
                value={formData.jurusan}
                onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
              >
                <option value="">Pilih Jurusan...</option>
                <option value="SIJA">SIJA</option>
                <option value="TJAT">TJAT</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
