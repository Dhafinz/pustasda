'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface RequestItem {
  id: number
  createdAt: string
  student: {
    name: string
    email: string
  }
  competition: {
    title: string
    organizer: string
    level: string
    category: {
      name: string
      color: string
    }
  }
}

export function TeacherInboxClient({ requests: initialRequests }: { requests: RequestItem[] }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [requests, setRequests] = useState<RequestItem[]>(initialRequests)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const handleResponse = async (id: number, status: 'accepted' | 'rejected') => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/teacher/mentorships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await res.json()
      if (res.ok) {
        addToast(data.message, 'success')
        // Remove from local list
        setRequests((prev) => prev.filter((r) => r.id !== id))
        router.refresh()
      } else {
        addToast(data.error || 'Gagal memperbarui status', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <ToastContainer />

      <div className="page-header">
        <h1>
          <i className="fa-solid fa-inbox text-red"></i> Pengajuan Bimbingan Pending
        </h1>
        <p>Tinjau dan proses permohonan pendampingan lomba akademik yang diajukan oleh siswa.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {requests.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Siswa &amp; Waktu Pengajuan</th>
                <th>Kompetisi</th>
                <th style={{ textAlign: 'right' }}>Aksi Keputusan</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div>
                      <strong style={{ fontSize: '0.82rem', display: 'block' }}>{req.student.name}</strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>
                        {req.student.email} &bull; {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span style={{ fontSize: '0.62rem', background: `${req.competition.category.color}15`, color: req.competition.category.color, padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginBottom: '2px' }}>
                        {req.competition.category.name}
                      </span>
                      <strong style={{ fontSize: '0.8rem', display: 'block' }}>{req.competition.title}</strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>{req.competition.organizer} ({req.competition.level})</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleResponse(req.id, 'accepted')}
                        disabled={updatingId === req.id}
                      >
                        Terima
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                        onClick={() => handleResponse(req.id, 'rejected')}
                        disabled={updatingId === req.id}
                      >
                        Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ padding: '40px' }}>
            <i className="fa-regular fa-envelope-open" style={{ fontSize: '3rem' }}></i>
            <h3>Kotak Masuk Kosong</h3>
            <p>Tidak ada pengajuan bimbingan pending saat ini. Semua permohonan telah selesai diproses.</p>
          </div>
        )}
      </div>
    </div>
  )
}
