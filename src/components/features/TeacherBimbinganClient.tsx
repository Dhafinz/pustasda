'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

interface Activity {
  id: number
  title: string
  description: string | null
  scheduleDate: string | null
  status: string
  teacherNotes: string | null
  documentUrl: string | null
  location: string | null
}

interface MentorshipDetail {
  id: number
  participationId: number
  teacherId: number
  status: string
  respondedAt: string | null
  createdAt: string
  student: {
    id: number
    name: string
    email: string
    photo: string | null
  }
  competition: {
    id: number
    title: string
    organizer: string
    level: string
    type: string
    category: {
      name: string
      color: string
      icon: string
    }
  }
  team: {
    id: number
    teamName: string | null
    members: Array<{
      id: number
      name: string
      role: string | null
    }>
  } | null
  activities: Activity[]
}

interface Props {
  initialMentorships: MentorshipDetail[]
}

export function TeacherBimbinganClient({ initialMentorships }: Props) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [mentorships, setMentorships] = useState<MentorshipDetail[]>(initialMentorships)
  const [selectedM, setSelectedM] = useState<MentorshipDetail | null>(
    initialMentorships.filter(m => m.status === 'accepted').length > 0
      ? initialMentorships.filter(m => m.status === 'accepted')[0]
      : initialMentorships.length > 0 ? initialMentorships[0] : null
  )

  // Actions
  const [updating, setUpdating] = useState(false)

  // Modal: Tambah Kegiatan oleh Guru
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actDate, setActDate] = useState('')
  const [actDocUrl, setActDocUrl] = useState('')
  const [actLocation, setActLocation] = useState('Offline / Sekolah')

  // Modal: Review Activity (Approve/Reject + Notes)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null)
  const [reviewStatus, setReviewStatus] = useState('approved')
  const [reviewNotes, setReviewNotes] = useState('')

  const activeM = mentorships.find(m => m.id === selectedM?.id) || selectedM

  // Accept or Reject mentorship request
  const handleMentorshipResponse = async (status: 'accepted' | 'rejected') => {
    if (!activeM) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/teacher/mentorships/${activeM.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()

      if (res.ok) {
        addToast(data.message, 'success')
        refreshActiveMentorship()
      } else {
        addToast(data.error || 'Gagal merespon', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Create new activity directly as teacher (auto-approved)
  const handleAddActivityTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeM) return
    setUpdating(true)
    try {
      // Teachers can add activities using the same student activity endpoint
      const res = await fetch(`/api/participations/${activeM.participationId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: actTitle,
          description: actDesc,
          scheduleDate: actDate,
          documentUrl: actDocUrl,
          location: actLocation
        })
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Bimbingan konsultasi berhasil ditambahkan ke timeline.', 'success')
        setIsActivityModalOpen(false)
        setActTitle('')
        setActDesc('')
        setActDate('')
        setActDocUrl('')
        setActLocation('Offline / Sekolah')
        refreshActiveMentorship()
      } else {
        addToast(data.error || 'Gagal menambahkan bimbingan', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Submit Activity Review (Approve/Reject + Notes)
  const handleReviewActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeM || !selectedAct) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/teacher/activities/${selectedAct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          teacherNotes: reviewNotes
        })
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Status progres aktivitas berhasil diperbarui.', 'success')
        setIsReviewModalOpen(false)
        setSelectedAct(null)
        setReviewNotes('')
        refreshActiveMentorship()
      } else {
        addToast(data.error || 'Gagal mengupdate aktivitas', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Sync active mentorship data from server
  const refreshActiveMentorship = async () => {
    if (!activeM) return
    try {
      // Just reload the page to refresh all server data nicely, or fetch api
      router.refresh()
      // Let's also update local states dynamically
      const res = await fetch(`/api/participations/${activeM.participationId}`)
      if (res.ok) {
        const data = await res.json()
        const updatedM: MentorshipDetail = {
          ...activeM,
          status: data.mentorship.status,
          activities: data.mentorship.activities
        }
        setMentorships((prev) =>
          prev.map((m) => (m.id === updatedM.id ? updatedM : m))
        )
        setSelectedM(updatedM)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="badge-pill badge-green">Aktif Membimbing</span>
      case 'pending':
        return <span className="badge-pill badge-yellow">Pengajuan Pending</span>
      case 'rejected':
        return <span className="badge-pill badge-red">Ditolak</span>
      default:
        return <span className="badge-pill badge-gray">{status}</span>
    }
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      <div className="explore-layout">
        {/* Left Column: Mentorship List */}
        <div>
          <div className="section-header">
            <h2 className="section-title">
              <i className="fa-solid fa-graduation-cap text-red"></i> Daftar Bimbingan Siswa
            </h2>
          </div>

          {mentorships.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {mentorships.map((m) => (
                <div
                  key={m.id}
                  className={`card ${activeM?.id === m.id ? 'active' : ''}`}
                  onClick={() => setSelectedM(m)}
                  style={{
                    cursor: 'pointer',
                    border: activeM?.id === m.id ? '1.5px solid var(--red)' : '1px solid rgba(0,0,0,0.04)',
                    boxShadow: activeM?.id === m.id ? 'var(--shadow-red)' : 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', background: `${m.competition.category.color}15`, color: m.competition.category.color, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                      {m.competition.category.name}
                    </span>
                    {getStatusBadge(m.status)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)' }}>
                      {m.student.name}
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Lomba: {m.competition.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-solid fa-graduation-cap"></i>
                <h3>Belum ada bimbingan</h3>
                <p>Belum ada siswa yang mendaftarkan Anda sebagai pembimbing kompetisi.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Timeline / Acceptance Screen */}
        <div>
          {activeM ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Mentorship Main Card */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Siswa Bimbingan
                    </span>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{activeM.student.name}</h2>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{activeM.student.email}</p>
                  </div>
                  {getStatusBadge(activeM.status)}
                </div>

                <div style={{ background: 'var(--gray-light)', padding: '14px', borderRadius: 'var(--radius)', marginBottom: '18px' }}>
                  <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--dark)' }}>Lomba yang Diikuti:</strong>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginTop: '2px' }}>{activeM.competition.title}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>
                    Penyelenggara: {activeM.competition.organizer} &bull; Cakupan: {activeM.competition.level}
                  </span>

                  {activeM.team && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--gray-mid)' }}>
                      <strong style={{ fontSize: '0.75rem', display: 'block', color: 'var(--dark)' }}>Nama Kelompok/Tim: {activeM.team.teamName}</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {activeM.team.members.map((mem) => (
                          <span key={mem.id} style={{ fontSize: '0.65rem', background: 'var(--blue-light)', color: 'var(--blue)', padding: '2px 8px', borderRadius: '10px' }}>
                            {mem.name} ({mem.role || 'Anggota'})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Respond Actions for Pending Mentorships */}
                {activeM.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleMentorshipResponse('accepted')} disabled={updating}>
                      Terima Pengajuan Bimbingan
                    </button>
                    <button className="btn btn-outline" style={{ flex: 1, color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleMentorshipResponse('rejected')} disabled={updating}>
                      Tolak
                    </button>
                  </div>
                )}
              </div>

              {/* Timeline Activities (Only visible if mentorship is active/accepted) */}
              {activeM.status === 'accepted' && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 className="card-title">
                      <i className="fa-solid fa-timeline text-blue"></i> Timeline Kegiatan Bimbingan
                    </h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => setIsActivityModalOpen(true)}>
                      <i className="fa-solid fa-plus"></i> Tambah Konsultasi
                    </button>
                  </div>

                  {activeM.activities.length > 0 ? (
                    <div className="timeline">
                      {activeM.activities.map((act) => (
                        <div key={act.id} className={`timeline-item ${act.status === 'approved' ? 'completed' : 'active'}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div className="timeline-date">
                              {act.scheduleDate ? new Date(act.scheduleDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </div>

                            {/* Verification Button for Pending Activities */}
                            {act.status === 'pending' ? (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.62rem' }}
                                onClick={() => {
                                  setSelectedAct(act)
                                  setReviewStatus('approved')
                                  setIsReviewModalOpen(true)
                                }}
                              >
                                Tinjau Progres
                              </button>
                            ) : act.status === 'approved' ? (
                              <span style={{ fontSize: '0.62rem', background: 'var(--green-light)', color: 'var(--green)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                Disetujui Pembimbing
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.62rem', background: 'var(--red-light)', color: 'var(--red)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                Ditolak / Butuh Revisi
                              </span>
                            )}
                          </div>

                          <div className="timeline-title" style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '2px' }}>{act.title}</div>
                          <div className="timeline-desc" style={{ fontSize: '0.78rem' }}>{act.description}</div>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'var(--gray)', marginTop: '4px', marginBottom: '4px' }}>
                            <span><i className="fa-solid fa-location-dot"></i> {act.location || 'Offline / Sekolah'}</span>
                            {act.documentUrl && (
                              <a href={act.documentUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                                <i className="fa-solid fa-paperclip"></i> Bukti Dokumen
                              </a>
                            )}
                          </div>

                          {act.teacherNotes && (
                            <div style={{ background: 'var(--gray-light)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--gray-dark)', marginTop: '6px', borderLeft: '3px solid var(--gray-mid)' }}>
                              <strong>Catatan Anda:</strong> {act.teacherNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '20px 0' }}>
                      <i className="fa-solid fa-timeline"></i>
                      <p>Siswa belum mencatatkan progres kegiatan bimbingan.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-solid fa-user-graduate"></i>
                <h3>Pilih Siswa Bimbingan</h3>
                <p>Klik salah satu entitas di panel kiri untuk membuka lembar bimbingan dan timeline kegiatan progres.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tambah Konsultasi Langsung oleh Guru */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Catat Sesi Konsultasi Bimbingan"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsActivityModalOpen(false)}>Batal</button>
            <button className="btn btn-primary btn-sm" onClick={handleAddActivityTeacher} disabled={!actTitle.trim() || !actDate}>Simpan</button>
          </>
        }
      >
        <form onSubmit={handleAddActivityTeacher}>
          <div className="form-group">
            <label className="form-label">Nama Kegiatan Sesi</label>
            <input
              type="text"
              className="form-input"
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
              placeholder="Contoh: Konsultasi perbaikan slide deck / Mentoring teknis coding..."
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Catatan Hasil Sesi Konsultasi</label>
            <textarea
              className="form-input"
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
              placeholder="Berikan catatan perbaikan, arahan pengerjaan, atau poin-poin revisi teknis..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Konsultasi</label>
            <input
              type="date"
              className="form-input"
              value={actDate}
              onChange={(e) => setActDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tautan Dokumen / Modul Pendukung (Optional)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                value={actDocUrl}
                onChange={(e) => setActDocUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                style={{ flex: 1 }}
              />
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', height: '38px', gap: '6px', margin: 0, whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-cloud-arrow-up"></i> Upload Foto
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    addToast('Mengunggah berkas...', 'info')
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const data = await res.json()
                      if (res.ok) {
                        setActDocUrl(window.location.origin + data.url)
                        addToast('Berkas berhasil diunggah!', 'success')
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
          <div className="form-group">
            <label className="form-label">Lokasi / Platform Pertemuan</label>
            <input
              type="text"
              className="form-input"
              value={actLocation}
              onChange={(e) => setActLocation(e.target.value)}
              placeholder="e.g. Lab SIJA TJAT, Ruang Kelas XI SIJA TJAT, Google Meet, Zoom"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Review Activity Progress */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Tinjau &amp; ACC Progres Aktivitas Siswa"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsReviewModalOpen(false)}>Batal</button>
            <button className="btn btn-primary btn-sm" onClick={handleReviewActivity}>Simpan Keputusan</button>
          </>
        }
      >
        {selectedAct && (
          <form onSubmit={handleReviewActivity}>
            <div style={{ background: 'var(--gray-light)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '0.78rem' }}>
              <strong>Aktivitas Siswa:</strong> "{selectedAct.title}"<br />
              <strong>Deskripsi Progres:</strong> {selectedAct.description || '-'}
            </div>

            <div className="form-group">
              <label className="form-label">Keputusan Verifikasi</label>
              <select className="form-select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
                <option value="approved">Setujui Progres (ACC)</option>
                <option value="rejected">Tolak / Butuh Revisi</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan Pembimbing / Evaluasi</label>
              <textarea
                className="form-input"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Masukkan pesan evaluasi perbaikan atau alasan penolakan progres..."
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
