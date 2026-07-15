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
          jurusan: formData.jurusan
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
                <option value="X SIJA TJAT">X SIJA TJAT</option>
                <option value="XI SIJA TJAT">XI SIJA TJAT</option>
                <option value="XII SIJA TJAT">XII SIJA TJAT</option>
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
                <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                <option value="Teknik Komputer & Jaringan">Teknik Komputer & Jaringan</option>
                <option value="Desain Komunikasi Visual">Desain Komunikasi Visual</option>
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
