'use client'

import { useState } from 'react'

interface Activity {
  id: number
  title: string
  description: string | null
  scheduleDate: string | null
  status: string
  teacherNotes: string | null
  documentUrl?: string | null
  location?: string | null
}

interface MentorshipItem {
  id: number
  status: string
  createdAt: string
  teacherName: string
  student: {
    id: number
    name: string
    email: string
  }
  competition: {
    id: number
    title: string
    organizer: string
  }
  activities: Activity[]
}

export function AdminMonitoringClient({ initialMentorships }: { initialMentorships: MentorshipItem[] }) {
  const [mentorships, setMentorships] = useState<MentorshipItem[]>(initialMentorships)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedM, setSelectedM] = useState<MentorshipItem | null>(
    initialMentorships.length > 0 ? initialMentorships[0] : null
  )

  const activeM = mentorships.find(m => m.id === selectedM?.id) || selectedM

  // Filter lists locally
  const filtered = mentorships.filter((m) =>
    m.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="badge-pill badge-green">Aktif</span>
      case 'pending': return <span className="badge-pill badge-yellow">Pending</span>
      default: return <span className="badge-pill badge-red">Ditolak</span>
    }
  }

  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>
          <i className="fa-solid fa-desktop text-red"></i> Pemantauan Bimbingan Lomba (Monitoring)
        </h1>
        <p>Pantau rekam jejak konsultasi dan progres garis waktu (timeline) antara guru pembimbing dan siswa binaan.</p>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Cari berdasarkan nama siswa, guru pembimbing, atau nama lomba..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Split Layout */}
      <div className="explore-layout">
        {/* Left Column: Mentorship List */}
        <div>
          {filtered.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className={`card ${activeM?.id === m.id ? 'active' : ''}`}
                  onClick={() => setSelectedM(m)}
                  style={{
                    cursor: 'pointer',
                    border: activeM?.id === m.id ? '1.5px solid var(--red)' : '1px solid rgba(0,0,0,0.04)',
                    boxShadow: activeM?.id === m.id ? 'var(--shadow-red)' : 'var(--shadow)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--dark)' }}>{m.student.name}</strong>
                    {getStatusBadge(m.status)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>
                    Lomba: {m.competition.title}<br />
                    Pembimbing: <strong>{m.teacherName}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-solid fa-graduation-cap"></i>
                <h3>Bimbingan tidak ditemukan</h3>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timeline Log Detail */}
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h3 className="section-title">
              <i className="fa-solid fa-timeline text-red"></i> Progres Garis Waktu Bimbingan
            </h3>
          </div>

          <div className="detail-panel-body">
            {activeM ? (
              <div>
                <div style={{ background: 'var(--gray-light)', padding: '14px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                    Siswa: <strong>{activeM.student.name}</strong> ({activeM.student.email})
                  </div>
                  <div style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                    Lomba: <strong>{activeM.competition.title}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    Guru Pembimbing: <strong>{activeM.teacherName}</strong>
                  </div>
                </div>

                {activeM.activities.length > 0 ? (
                  <div className="timeline">
                    {activeM.activities.map((act) => (
                      <div key={act.id} className={`timeline-item ${act.status === 'approved' ? 'completed' : 'active'}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="timeline-date">{formatDateStr(act.scheduleDate)}</span>
                          <span style={{ 
                            fontSize: '0.62rem', 
                            background: act.status === 'approved' ? 'var(--green-light)' : act.status === 'rejected' ? 'var(--red-light)' : 'var(--yellow-light)', 
                            color: act.status === 'approved' ? 'var(--green)' : act.status === 'rejected' ? 'var(--red)' : 'var(--yellow)', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontWeight: 600 
                          }}>
                            {act.status === 'approved' ? 'ACC Pembimbing' : act.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </span>
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
                          <div style={{ background: 'var(--white)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--gray-dark)', marginTop: '6px', borderLeft: '3px solid var(--gray-mid)' }}>
                            <strong>Catatan Guru:</strong> {act.teacherNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '20px 0' }}>
                    <i className="fa-solid fa-timeline"></i>
                    <p>Siswa dan pembimbing belum mencatatkan riwayat progres konsultasi.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="detail-panel-empty">
                <i className="fa-solid fa-hand-pointer"></i>
                <h3>Pilih Entitas</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
