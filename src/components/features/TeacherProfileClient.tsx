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
}

export function TeacherProfileClient({ initialData }: { initialData: TeacherProfileData }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [formData, setFormData] = useState(initialData)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(saving)
    try {
      // Reusing student endpoint with standard profile fields. Let's make an API route or server action, but for simplicity let's make an API route at `src/app/api/teacher/profile/route.ts` which we will create next.
      const res = await fetch('/api/teacher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          waNumber: formData.waNumber,
          bidangKeahlian: formData.bidangKeahlian
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
