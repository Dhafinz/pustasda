'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

interface Teacher {
  id: number
  name: string
  photo: string | null
  bidang: string
  jabatan: string
}

interface Step {
  id: number
  stepName: string
  stepOrder: number
  isConfirmed: boolean
  confirmedAt: string | null
  notes: string | null
}

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

interface TeamMember {
  id: number
  userId: number
  status: string
  role: string | null
  user: {
    id: number
    name: string
    photo: string | null
    email: string
  }
}

interface ParticipationDetail {
  id: number
  userId: number
  competitionId: number
  teamId: number | null
  status: string
  result: string
  currentStage: number
  notes: string | null
  createdAt: string
  daysRemaining: number
  competition: {
    id: number
    title: string
    organizer: string
    level: string
    type: string
    maxMembers: number
    minMembers: number
    description: string | null
    requirements: string | null
    poster: string | null
    cover: string | null
    deadline: string
    category: {
      name: string
      color: string
      icon: string
    }
    field: {
      name: string
      icon: string
    }
    stages: Array<{
      id: number
      stageNumber: number
      stageName: string
      deadline: string | null
      description: string | null
    }>
  }
  team: {
    id: number
    teamName: string | null
    inviteCode: string
    status: string
    leaderId: number
    leader: {
      id: number
      name: string
      photo: string | null
    }
    members: TeamMember[]
  } | null
  steps: Step[]
  mentorship: {
    id: number
    status: string
    teacher: {
      id: number
      name: string
      photo: string | null
      email: string
    }
    activities: Activity[]
  } | null
}

interface Props {
  initialParticipations: ParticipationDetail[]
  teachers: Teacher[]
  currentUserId: number
}

export function StudentParticipationsClient({
  initialParticipations,
  teachers,
  currentUserId
}: Props) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [participations, setParticipations] = useState<ParticipationDetail[]>(initialParticipations)
  const [selectedP, setSelectedP] = useState<ParticipationDetail | null>(
    initialParticipations.length > 0 ? initialParticipations[0] : null
  )

  // Interactive UI Actions State
  const [updating, setUpdating] = useState(false)
  const [requestingMentor, setRequestingMentor] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  // Modal: Tambah Aktivitas
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [activityTitle, setActivityTitle] = useState('')
  const [activityDesc, setActivityDesc] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [activityDocUrl, setActivityDocUrl] = useState('')
  const [activityLocation, setActivityLocation] = useState('Offline / Sekolah')

  // Modal: Selesaikan Lomba (Siswa Juara)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState('belum_diisi')
  const [proofUrl, setProofUrl] = useState('')

  // Modal: Submit Karya Proof Upload
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [submitProofUrl, setSubmitProofUrl] = useState('')

  // Edit Role Tag State
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [editRoleValue, setEditRoleValue] = useState('')

  // Join Team by Invite Code States
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setJoining(true)
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Sukses bergabung ke dalam tim kelompok!', 'success')
        setIsJoinTeamModalOpen(false)
        setInviteCode('')
        router.refresh()
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        addToast(data.error || 'Kode undangan tidak valid.', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setJoining(false)
    }
  }

  const activeP = participations.find((p) => p.id === selectedP?.id) || selectedP

  // Start Working / Mulai Pengerjaan (Confirm step 2)
  const handleStartWorking = async () => {
    if (!activeP) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/participations/${activeP.id}/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepOrder: 2, isConfirmed: true, notes: 'Memulai proses pengerjaan kompetisi' }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Selamat bekerja! Status diperbarui menjadi Pengerjaan.', 'success')
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal memperbarui status', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Submit competition (confirm step 3, move to 'submitted')
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeP || !submitProofUrl) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/participations/${activeP.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', notes: submitProofUrl }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Karya berhasil dikonfirmasi! Anda mendapatkan poin keikutsertaan.', 'success')
        setIsSubmitModalOpen(false)
        setSubmitProofUrl('')
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal konfirmasi submit', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Complete competition (confirm step 4, specify juara/result)
  const handleCompleteWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeP) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/participations/${activeP.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'complete', 
          result: selectedResult,
          notes: proofUrl
        }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Kompetisi berhasil diselesaikan! Poin prestasi ditambahkan.', 'success')
        setIsCompleteModalOpen(false)
        setProofUrl('')
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal menyelesaikan kompetisi', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Declare Failure (not_submitted)
  const handleDeclareFailure = async () => {
    if (!activeP) return
    if (!confirm('Apakah Anda yakin ingin menandai kompetisi ini sebagai tidak sempat submit? Anda tetap mendapatkan poin berpartisipasi.')) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/participations/${activeP.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fail' }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Status diperbarui menjadi Gagal Submit.', 'info')
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal memperbarui status', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Request teacher for mentorship
  const handleRequestMentorship = async () => {
    if (!activeP || !selectedTeacherId) return
    setRequestingMentor(true)
    try {
      const res = await fetch(`/api/participations/${activeP.id}/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedTeacherId }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Permintaan pembimbing berhasil dikirim!', 'success')
        setSelectedTeacherId('')
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal mengirim permintaan', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setRequestingMentor(false)
    }
  }

  // Add a mentorship activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeP) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/participations/${activeP.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activityTitle,
          description: activityDesc,
          scheduleDate: activityDate,
          documentUrl: activityDocUrl,
          location: activityLocation
        }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Aktivitas berhasil ditambahkan ke timeline.', 'success')
        setIsActivityModalOpen(false)
        setActivityTitle('')
        setActivityDesc('')
        setActivityDate('')
        setActivityDocUrl('')
        setActivityLocation('Offline / Sekolah')
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal menambahkan aktivitas', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Save Team Member Role Tag
  const handleSaveMemberRole = async (memberId: number) => {
    if (!activeP || !activeP.team) return
    try {
      const res = await fetch(`/api/teams/${activeP.team.id}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRoleValue }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Role anggota tim berhasil diperbarui.', 'success')
        setEditingMemberId(null)
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal mengubah role', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    }
  }

  const handleKickMember = async (memberId: number, memberName: string) => {
    if (!activeP || !activeP.team) return
    if (!confirm(`Apakah Anda yakin ingin mengeluarkan ${memberName} dari tim?`)) return
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/teams/${activeP.team.id}/members/${memberId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        addToast(`${memberName} berhasil dikeluarkan dari tim.`, 'success')
        refreshActiveParticipation()
      } else {
        addToast(data.error || 'Gagal mengeluarkan anggota', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // Helper: Refresh active participation state from server
  const refreshActiveParticipation = async () => {
    if (!activeP) return
    try {
      const res = await fetch(`/api/participations/${activeP.id}`)
      if (res.ok) {
        const data = await res.json()
        setParticipations((prev) =>
          prev.map((p) => (p.id === data.id ? data : p))
        )
        setSelectedP(data)
      }
    } catch (err) {
      console.error('Failed to sync active participation', err)
    }
  }

  // Status Style Helper
  const getStatusBadge = (status: string, result: string) => {
    switch (status) {
      case 'registered':
        return <span className="badge-pill badge-blue">Terdaftar</span>
      case 'in_progress':
        return <span className="badge-pill badge-yellow">Pengerjaan</span>
      case 'submitted':
        return <span className="badge-pill bg-blue-light text-blue">Submitted</span>
      case 'completed':
        const award = result.replace('juara_', 'Juara ').toUpperCase()
        return <span className="badge-pill badge-green">{award === 'BELUM_DIISI' ? 'Selesai' : award}</span>
      case 'not_submitted':
        return <span className="badge-pill badge-red">Gagal Submit</span>
      default:
        return <span className="badge-pill badge-gray">{status}</span>
    }
  }

  // Date Formatting Helper
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
      <ToastContainer />

      <div className="explore-layout">
        {/* Left Column: Participation List */}
        <div>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              <i className="fa-solid fa-list-check text-red"></i> Lomba yang Diikuti
            </h2>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setIsJoinTeamModalOpen(true)}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <i className="fa-solid fa-right-to-bracket"></i> Gabung Tim
            </button>
          </div>

          {participations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {participations.map((p) => (
                <div
                  key={p.id}
                  className={`card ${activeP?.id === p.id ? 'active' : ''}`}
                  onClick={() => setSelectedP(p)}
                  style={{
                    cursor: 'pointer',
                    border: activeP?.id === p.id ? '1.5px solid var(--red)' : '1px solid rgba(0,0,0,0.04)',
                    boxShadow: activeP?.id === p.id ? 'var(--shadow-red)' : 'var(--shadow)',
                    display: 'flex',
                    gap: '16px',
                    padding: '16px'
                  }}
                >
                  {p.competition.poster ? (() => {
                    const firstPoster = p.competition.poster.split(',')[0].trim();
                    const srcUrl = (firstPoster.startsWith('/') || firstPoster.startsWith('http')) 
                      ? firstPoster 
                      : `/images/posters/${firstPoster}`;
                    return (
                      <img
                        src={srcUrl}
                        alt={p.competition.title}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                    );
                  })() : (
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${p.competition.category.color}15, ${p.competition.category.color}30)`,
                        fontSize: '1.8rem',
                        color: p.competition.category.color
                      }}
                    >
                      <i className={`fa-solid ${p.competition.category.icon}`}></i>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: p.competition.category.color,
                          textTransform: 'uppercase'
                        }}
                      >
                        {p.competition.category.name}
                      </span>
                      {getStatusBadge(p.status, p.result)}
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.competition.title}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>
                      Penyelenggara: {p.competition.organizer}
                    </div>
                    {p.daysRemaining > 0 && p.status !== 'completed' && p.status !== 'not_submitted' ? (
                      <div style={{ fontSize: '0.72rem', color: 'var(--red)', fontWeight: 600, marginTop: '6px' }}>
                        <i className="fa-regular fa-clock"></i> Sisa {p.daysRemaining} hari lagi
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-solid fa-trophy"></i>
                <h3>Belum mengikuti kompetisi</h3>
                <p>Anda belum mengikuti kompetisi apapun. Kunjungi menu <strong>Eksplor Lomba</strong> untuk mendaftar!</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Tracking Area */}
        <div>
          {activeP ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Main Info Card */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>
                      {activeP.competition.title}
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: '2px' }}>
                      Penyelenggara: <strong>{activeP.competition.organizer}</strong> | Skala: <strong>{activeP.competition.level}</strong>
                    </p>
                  </div>
                  {getStatusBadge(activeP.status, activeP.result)}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  <span className="badge-pill bg-red-light text-red">
                    <i className="fa-solid fa-calendar-day"></i> Deadline: {formatDateStr(activeP.competition.deadline)}
                  </span>
                  <span className="badge-pill bg-blue-light text-blue">
                    <i className="fa-solid fa-users"></i> {activeP.competition.type === 'team' ? 'Tim / Kelompok' : 'Solo / Individu'}
                  </span>
                </div>

                {/* Progress Steps Header */}
                <div style={{ background: 'var(--gray-light)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '10px' }}>Tahap Pelacakan Lomba</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {activeP.steps.map((s, idx) => (
                      <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: s.isConfirmed ? 'var(--green)' : 'var(--gray-mid)',
                            color: 'var(--white)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '4px'
                          }}
                        >
                          {s.isConfirmed ? <i className="fa-solid fa-check"></i> : s.stepOrder}
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: s.isConfirmed ? 'var(--dark)' : 'var(--gray)' }}>{s.stepName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Buttons */}
                {(() => {
                  const isLeader = !activeP.team || activeP.team.leaderId === currentUserId;
                  const hasMinMembers = !activeP.team || activeP.team.members.length >= activeP.competition.minMembers;
                  const isTeamFull = activeP.team && activeP.team.members.length >= activeP.competition.maxMembers;

                  return (
                    <div style={{ width: '100%' }}>
                      {!isLeader && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--red)', background: 'var(--red-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', borderLeft: '3px solid var(--red)' }}>
                          <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                          Hanya ketua tim (<strong>{activeP.team?.leader?.name || 'Ketua'}</strong>) yang dapat mengubah status dan progres pengerjaan lomba ini.
                        </div>
                      )}

                      {!hasMinMembers && isLeader && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--yellow-dark)', background: 'var(--yellow-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', borderLeft: '3px solid var(--yellow)' }}>
                          <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                          Jumlah anggota tim saat ini (<strong>{activeP.team?.members.length || 0} orang</strong>) kurang dari syarat minimal (<strong>{activeP.competition.minMembers} orang</strong>). Tim Anda harus memenuhi batas minimal sebelum Anda dapat memulai pengerjaan lomba ini.
                        </div>
                      )}

                      {isTeamFull && isLeader && activeP.status === 'registered' && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--green)', background: 'var(--green-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', borderLeft: '3px solid var(--green)' }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
                          Tim Anda sudah penuh dan telah memenuhi batas maksimal peserta yaitu <strong>{activeP.competition.maxMembers} orang</strong>.
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '10px' }}>
                        {activeP.status === 'registered' && (
                          <button
                            className="btn btn-primary btn-block"
                            onClick={handleStartWorking}
                            disabled={updating || !isLeader || !hasMinMembers}
                            style={(!isLeader || !hasMinMembers) ? { background: 'var(--gray-mid)', borderColor: 'var(--gray-mid)', color: 'var(--gray-dark)', cursor: 'not-allowed', opacity: 0.6 } : {}}
                          >
                            {updating ? 'Memproses...' : <><i className="fa-solid fa-play"></i> Mulai Pengerjaan Lomba</>}
                          </button>
                        )}

                        {activeP.status === 'in_progress' && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{
                                flex: 2,
                                ...(!isLeader ? { background: 'var(--gray-mid)', borderColor: 'var(--gray-mid)', color: 'var(--gray-dark)', cursor: 'not-allowed', opacity: 0.6 } : {})
                              }}
                              onClick={() => setIsSubmitModalOpen(true)}
                              disabled={updating || !isLeader}
                            >
                              <i className="fa-solid fa-paper-plane"></i> Konfirmasi Submit Karya
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{
                                flex: 1,
                                ...(!isLeader ? { background: 'var(--gray-light)', borderColor: 'var(--gray-mid)', color: 'var(--gray)', cursor: 'not-allowed', opacity: 0.6 } : {})
                              }}
                              onClick={handleDeclareFailure}
                              disabled={updating || !isLeader}
                            >
                              Gagal Submit
                            </button>
                          </>
                        )}

                        {activeP.status === 'submitted' && (
                          <button
                            className="btn btn-primary btn-block"
                            onClick={() => { setSelectedResult('juara_1'); setIsCompleteModalOpen(true); }}
                            disabled={!isLeader}
                            style={!isLeader ? { background: 'var(--gray-mid)', borderColor: 'var(--gray-mid)', color: 'var(--gray-dark)', cursor: 'not-allowed', opacity: 0.6 } : {}}
                          >
                            <i className="fa-solid fa-trophy"></i> Selesaikan Lomba &amp; Masukkan Juara
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                  {activeP.status === 'completed' && (
                    <div style={{ width: '100%', padding: '12px', background: 'var(--green-light)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', textAlign: 'center', fontWeight: 600 }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i> Lomba Selesai Diikuti. Terima kasih atas perjuangan luar biasa Anda!
                      {activeP.notes && (
                        <div style={{ marginTop: '8px', fontSize: '0.72rem' }}>
                          <a href={activeP.notes} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>
                            <i className="fa-solid fa-file-invoice"></i> Lihat Bukti Pengumuman/Sertifikat
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {activeP.status === 'not_submitted' && (
                    <div style={{ width: '100%', padding: '12px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', textAlign: 'center', fontWeight: 600 }}>
                      😞 Anda mengonfirmasi tidak submit karya untuk kompetisi ini.
                    </div>
                  )}
              </div>

              {/* Team Members Section (if Team) */}
              {activeP.team && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 className="card-title">
                      <i className="fa-solid fa-users text-blue"></i> Anggota Tim: <span style={{ color: 'var(--red)' }}>{activeP.team.teamName}</span>
                    </h3>
                    <span style={{ fontSize: '0.72rem', background: 'var(--gray-light)', padding: '4px 10px', borderRadius: '20px', fontFamily: 'monospace', fontWeight: 600 }}>
                      KODE: {activeP.team.inviteCode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeP.team.members.map((m) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--red)', color: 'var(--white)', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {m.user.photo && m.user.photo !== 'default-avatar.png' && m.user.photo !== 'default_avatar.png' ? (
                              <img src={m.user.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                            m.user.name.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || 'U'
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              {m.user.name} {m.userId === activeP.team?.leaderId && <span style={{ fontSize: '0.62rem', background: 'var(--red-light)', color: 'var(--red)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Ketua</span>}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>{m.user.email}</div>
                          </div>
                        </div>

                        {/* Role Tags Display & Editing */}
                        <div>
                          {editingMemberId === m.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                type="text"
                                className="form-input"
                                value={editRoleValue}
                                onChange={(e) => setEditRoleValue(e.target.value)}
                                style={{ width: '100px', padding: '4px 8px', fontSize: '0.72rem' }}
                                placeholder="Role tim..."
                              />
                              <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleSaveMemberRole(m.id)}>
                                <i className="fa-solid fa-check"></i>
                              </button>
                              <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setEditingMemberId(null)}>
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', background: 'var(--blue-light)', color: 'var(--blue)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                                {m.role || 'Anggota'}
                              </span>
                              {activeP.team?.leaderId === currentUserId && (
                                <>
                                  <button
                                    style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: '0.75rem' }}
                                    onClick={() => {
                                      setEditingMemberId(m.id)
                                      setEditRoleValue(m.role || '')
                                    }}
                                    title="Ubah Role"
                                  >
                                    <i className="fa-solid fa-pen"></i>
                                  </button>
                                  {m.userId !== activeP.team?.leaderId && (
                                    <button
                                      type="button"
                                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px', marginLeft: '4px' }}
                                      onClick={() => handleKickMember(m.id, m.user.name)}
                                      title="Keluarkan Anggota"
                                    >
                                      <i className="fa-solid fa-user-xmark"></i>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentorship Section */}
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: '14px' }}>
                  <i className="fa-solid fa-chalkboard-user text-yellow"></i> Guru Pembimbing
                </h3>

                {activeP.mentorship && activeP.mentorship.status !== 'rejected' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--gray-light)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gray-dark)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                          {activeP.mentorship.teacher.photo && activeP.mentorship.teacher.photo !== 'default-avatar.png' && activeP.mentorship.teacher.photo !== 'default_avatar.png' ? (
                            <img src={activeP.mentorship.teacher.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            activeP.mentorship.teacher.name.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || 'U'
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeP.mentorship.teacher.name}>{activeP.mentorship.teacher.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeP.mentorship.teacher.email}>{activeP.mentorship.teacher.email}</div>
                        </div>
                      </div>

                      <div>
                        {activeP.mentorship.status === 'pending' ? (
                          <span className="badge-pill badge-yellow">Menunggu ACC Guru</span>
                        ) : activeP.mentorship.status === 'accepted' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span className="badge-pill badge-green">Aktif Membimbing</span>
                            <a
                              href={`https://wa.me/${(activeP.mentorship.teacher as any).waNumber || '6281234567890'}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.68rem', borderColor: '#25D366', color: '#25D366', background: 'none' }}
                            >
                              <i className="fa-brands fa-whatsapp"></i> Chat WA
                            </a>
                          </div>
                        ) : (
                          <span className="badge-pill badge-red">Ditolak</span>
                        )}
                      </div>
                    </div>

                    {/* Timeline Activities Grid (Only visible if mentorship is accepted) */}
                    {activeP.mentorship.status === 'accepted' && (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <h4 style={{ fontSize: '0.82rem', fontWeight: 700 }}>Timeline Kegiatan Bimbingan</h4>
                          {(!activeP.team || activeP.team.leaderId === currentUserId) && (
                            <button className="btn btn-secondary btn-sm" onClick={() => setIsActivityModalOpen(true)}>
                              <i className="fa-solid fa-plus"></i> Tambah Kegiatan
                            </button>
                          )}
                        </div>

                        {activeP.mentorship.activities.length > 0 ? (
                          <div className="timeline">
                            {activeP.mentorship.activities.map((act) => (
                              <div key={act.id} className={`timeline-item ${act.status === 'approved' ? 'completed' : 'active'}`}>
                                <div className="timeline-date">{formatDateStr(act.scheduleDate)}</div>
                                <div className="timeline-title">
                                  {act.title}{' '}
                                  <span style={{ fontSize: '0.62rem', marginLeft: '6px', background: act.status === 'approved' ? 'var(--green-light)' : act.status === 'rejected' ? 'var(--red-light)' : 'var(--yellow-light)', color: act.status === 'approved' ? 'var(--green)' : act.status === 'rejected' ? 'var(--red)' : 'var(--yellow)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {act.status === 'approved' ? 'Disetujui' : act.status === 'rejected' ? 'Ditolak / Butuh Revisi' : 'Menunggu ACC Guru'}
                                  </span>
                                </div>
                                <div className="timeline-desc">{act.description}</div>
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
                                    <strong>Catatan Guru:</strong> {act.teacherNotes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textAlign: 'center', padding: '20px 0' }}>
                            Belum ada aktivitas kegiatan bimbingan ditambahkan. Mulailah mencatat progres pengerjaan Anda!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {activeP.mentorship && activeP.mentorship.status === 'rejected' && (
                      <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', marginBottom: '14px', borderLeft: '3px solid var(--red)' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
                        Pengajuan pembimbing sebelumnya ke <strong>{activeP.mentorship.teacher.name}</strong> ditolak. Silakan ajukan guru pembimbing baru di bawah.
                      </div>
                    )}
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray)', marginBottom: '12px' }}>
                      Ajukan guru pembimbing agar progres pengerjaan dan bimbingan Anda dapat terpantau dan di-ACC secara akademis.
                    </p>

                    {(!activeP.team || activeP.team.leaderId === currentUserId) ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          className="form-select"
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="">Pilih Guru Pembimbing...</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.bidang})
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-primary" onClick={handleRequestMentorship} disabled={requestingMentor || !selectedTeacherId}>
                          {requestingMentor ? 'Mengirim...' : 'Ajukan'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: 'var(--gray-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--gray)' }}>
                        <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                        Guru pembimbing hanya bisa diajukan oleh ketua tim (<strong>{activeP.team?.leader?.name || 'Ketua'}</strong>).
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-solid fa-clipboard-list"></i>
                <h3>Pilih Lomba Untuk Dipantau</h3>
                <p>Klik salah satu lomba pada daftar kiri untuk memantau detail pengerjaan, tim, dan bimbingan.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tambah Aktivitas Timeline */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Tambah Aktivitas Kegiatan"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsActivityModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleAddActivity} disabled={!activityTitle.trim() || !activityDate}>
              Simpan
            </button>
          </>
        }
      >
        <form onSubmit={handleAddActivity}>
          <div className="form-group">
            <label className="form-label">Nama Kegiatan / Progres</label>
            <input
              type="text"
              className="form-input"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              placeholder="Contoh: Pengumpulan berkas tahap 1 / Pembuatan slide presentasi..."
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi Hasil &amp; Output</label>
            <textarea
              className="form-input"
              value={activityDesc}
              onChange={(e) => setActivityDesc(e.target.value)}
              placeholder="Detail apa yang dikerjakan beserta tautan output/progress jika ada..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal Pelaksanaan</label>
            <input
              type="date"
              className="form-input"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tautan Bukti Dokumen / Output Karya (Optional)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                value={activityDocUrl}
                onChange={(e) => setActivityDocUrl(e.target.value)}
                placeholder="https://drive.google.com/... / https://github.com/..."
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
                        setActivityDocUrl(window.location.origin + data.url)
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
              value={activityLocation}
              onChange={(e) => setActivityLocation(e.target.value)}
              placeholder="Offline / Sekolah (e.g. Lab RPL, Zoom)"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Selesaikan Lomba (Masukkan Juara) */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Selesaikan Lomba &amp; Klaim Poin"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsCompleteModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleCompleteWork}>
              Simpan &amp; Klaim Poin
            </button>
          </>
        }
      >
        <form onSubmit={handleCompleteWork}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Hasil Prestasi / Juara Keberapa</label>
            <select className="form-select" value={selectedResult} onChange={(e) => setSelectedResult(e.target.value)}>
              <option value="belum_diisi">Peserta (Tanpa Juara)</option>
              <option value="juara_1">Juara 1 🥇</option>
              <option value="juara_2">Juara 2 🥈</option>
              <option value="juara_3">Juara 3 🥉</option>
              <option value="juara_harapan">Juara Harapan</option>
              <option value="favorit">Juara Favorit</option>
              <option value="terpilih">Karya Terpilih</option>
              <option value="lolos_tahap">Lolos Tahap Awal</option>
              <option value="tidak_lolos">Tidak Lolos</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Tautan Bukti Pengumuman / Sertifikat Juara</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                className="form-input" 
                value={proofUrl} 
                onChange={(e) => setProofUrl(e.target.value)} 
                placeholder="https://drive.google.com/file/... / https://sertifikat.com" 
                required
                style={{ flex: 1 }}
              />
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', height: '38px', gap: '6px', margin: 0, whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-cloud-arrow-up"></i> Upload Bukti
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    addToast('Mengunggah bukti...', 'info')
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const data = await res.json()
                      if (res.ok) {
                        setProofUrl(window.location.origin + data.url)
                        addToast('Bukti berhasil diunggah!', 'success')
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
          <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.4 }}>
            Memasukkan hasil prestasi yang benar sangat krusial untuk kalkulasi akumulasi poin di **Leaderboard**. Admin sekolah akan memvalidasi bukti sertifikat / pengumuman jika diperlukan.
          </p>
        </form>
      </Modal>

      {/* Submit Karya Proof Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Konfirmasi Submit Karya Lomba"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsSubmitModalOpen(false)} disabled={updating}>
              Batal
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmitWork} disabled={updating || !submitProofUrl}>
              {updating ? 'Mengirim...' : 'Konfirmasi & Kirim'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitWork}>
          <div style={{ background: 'var(--red-light)', borderLeft: '3px solid var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--red)', marginBottom: '14px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
            <strong>Wajib Unggah Bukti!</strong> Anda harus menyertakan bukti berupa foto/screenshot halaman submit karya Anda sebagai validasi progres pengerjaan.
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Foto / Screenshot Bukti Submit (JPG/PNG)</label>
            {submitProofUrl ? (
              <div style={{ marginBottom: '12px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--gray-mid)', maxHeight: '180px' }}>
                <img src={submitProofUrl} style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', background: 'var(--gray-light)' }} alt="Screenshot bukti submit" />
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                value={submitProofUrl}
                onChange={(e) => setSubmitProofUrl(e.target.value)}
                placeholder="Upload file atau masukkan URL gambar..."
                style={{ flex: 1 }}
                required
              />
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', height: '38px', gap: '6px', margin: 0, whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-cloud-arrow-up"></i> Upload Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    addToast('Mengunggah screenshot bukti...', 'info')
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const data = await res.json()
                      if (res.ok) {
                        // relative path only!
                        setSubmitProofUrl(data.url)
                        addToast('Screenshot bukti berhasil diunggah!', 'success')
                      } else {
                        addToast(data.error || 'Gagal mengunggah gambar', 'error')
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
        </form>
      </Modal>

      {/* Join Team Modal */}
      <Modal
        isOpen={isJoinTeamModalOpen}
        onClose={() => setIsJoinTeamModalOpen(false)}
        title="Gabung Tim Menggunakan Kode"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsJoinTeamModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleJoinTeamSubmit} disabled={joining || !inviteCode.trim()}>
              {joining ? 'Memproses...' : 'Gabung Tim'}
            </button>
          </>
        }
      >
        <form onSubmit={handleJoinTeamSubmit}>
          <div className="form-group">
            <label className="form-label">Kode Undangan Tim</label>
            <input
              type="text"
              className="form-input"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Contoh: PST-XXXXXX"
              required
              autoFocus
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.4 }}>
            Pastikan kode undangan sesuai dengan tim yang dibuat oleh ketua tim Anda. Setelah bergabung, Anda dapat melihat progres bimbingan secara bersama-sama di halaman **Lomba Saya**.
          </p>
        </form>
      </Modal>
    </div>
  )
}
