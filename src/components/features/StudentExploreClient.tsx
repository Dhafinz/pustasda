'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CompCard } from '@/components/ui/CompCard'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface Category {
  id: number
  name: string
  icon: string
  color: string
}

interface Field {
  id: number
  name: string
  icon: string
}

interface CompetitionData {
  id: number
  title: string
  organizer: string
  level: string
  type: string
  maxMembers: number
  minMembers: number
  description: string | null
  requirements: string | null
  linkRegistration: string | null
  guidebookLink: string | null
  poster: string | null
  cover: string | null
  registerDeadline: string | null
  deadline: string
  announcementDate: string | null
  totalStages: number
  isTrending: boolean
  viewCount: number
  createdAt: string
  category: {
    id: number
    name: string
    icon: string
    color: string
  }
  field: {
    id: number
    name: string
    icon: string
  }
  stats: {
    participations: number
    teams: number
  }
  isJoined?: boolean
}

interface Props {
  initialCompetitions: CompetitionData[]
  categories: Category[]
  fields: Field[]
  totalComps: number
  joinedCompIds: number[]
}

type ChipFilter = 'all' | 'trending' | 'newest' | 'national' | 'deadline'

export function StudentExploreClient({
  initialCompetitions,
  categories,
  fields,
  totalComps,
  joinedCompIds,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast, ToastContainer } = useToast()

  // Competition List & Pagination
  const [competitions, setCompetitions] = useState<CompetitionData[]>(initialCompetitions)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: totalComps,
    totalPages: Math.ceil(totalComps / 10),
  })

  // Selected Competition for Detail Panel
  const [selectedComp, setSelectedComp] = useState<CompetitionData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [currentPosterIdx, setCurrentPosterIdx] = useState(0)

  useEffect(() => {
    setCurrentPosterIdx(0)
  }, [selectedComp?.id])

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeChip, setActiveChip] = useState<ChipFilter>('all')
  const [selectedCat, setSelectedCat] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [loadingList, setLoadingList] = useState(false)

  // Team Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [joining, setJoining] = useState(false)
  const [inviteCodeModalOpen, setInviteCodeModalOpen] = useState(false)
  const [createdInviteCode, setCreatedInviteCode] = useState('')
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Select initial competition if ID in URL query parameter
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      const compId = parseInt(idParam)
      // Check if it's already in the initial list
      const found = initialCompetitions.find((c) => c.id === compId)
      if (found) {
        setSelectedComp(found)
      } else {
        // Fetch from API
        fetchCompDetail(compId)
      }
    } else if (initialCompetitions.length > 0) {
      setSelectedComp(initialCompetitions[0])
    }
  }, [searchParams])

  // Fetch full details of a competition (inc increment view count)
  const fetchCompDetail = async (compId: number) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/competitions/${compId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedComp({
          ...data,
          isJoined: joinedCompIds.includes(data.id),
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  };

  // Fetch filtered competitions list
  const fetchCompetitions = async (page = 1) => {
    setLoadingList(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '10')

      if (debouncedSearch) params.append('search', debouncedSearch)
      if (selectedCat) params.append('category', selectedCat)
      if (selectedField) params.append('field', selectedField)
      if (selectedLevel) params.append('level', selectedLevel)
      if (selectedType) params.append('type', selectedType)

      if (activeChip !== 'all') {
        params.append('filter', activeChip)
      }

      const res = await fetch(`/api/competitions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const enriched = data.competitions.map((comp: any) => ({
          ...comp,
          isJoined: joinedCompIds.includes(comp.id),
        }))
        setCompetitions(enriched)
        setPagination(data.pagination)

        // Select the first competition of the new list by default if no active select or previous select is not in the list
        if (enriched.length > 0) {
          const hasUrlId = searchParams.get('id')
          if (hasUrlId) {
            // If the URL specifies an ID, try to find it in the new list to keep details in sync
            const matchingComp = enriched.find((c: any) => c.id === parseInt(hasUrlId))
            if (matchingComp) {
              setSelectedComp(matchingComp)
            }
            // Otherwise, do not override selectedComp (leave it to fetchCompDetail)
          } else {
            // Standard fallback: select first if no active select or previous select is gone
            const isPreviousInList = enriched.find((c: any) => c.id === selectedComp?.id)
            if (!selectedComp || !isPreviousInList) {
              setSelectedComp(enriched[0])
            }
          }
        } else {
          setSelectedComp(null)
        }
      }
    } catch (err) {
      addToast('Gagal memuat data kompetisi', 'error')
    } finally {
      setLoadingList(false)
    }
  }

  // Trigger list refresh when filter states change
  useEffect(() => {
    fetchCompetitions(1)
  }, [debouncedSearch, activeChip, selectedCat, selectedField, selectedLevel, selectedType])

  // Join competition function (individual) or trigger team modal
  const handleJoin = async () => {
    if (!selectedComp) return

    if (selectedComp.type === 'team') {
      setTeamName(`Tim ${selectedComp.title.slice(0, 20)}`)
      setIsTeamModalOpen(true)
      return
    }

    // Solo join flow
    setJoining(true)
    try {
      const res = await fetch('/api/participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: selectedComp.id }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast(data.message || 'Berhasil mengikuti lomba!', 'success')
        // Mark as joined locally
        joinedCompIds.push(selectedComp.id)
        setSelectedComp((prev) => (prev ? { ...prev, isJoined: true } : null))
        setCompetitions((prev) =>
          prev.map((c) => (c.id === selectedComp.id ? { ...c, isJoined: true } : c))
        )
        router.refresh()
      } else {
        addToast(data.error || 'Gagal mendaftar', 'error')
      }
    } catch (err) {
      addToast('Terjadi kesalahan jaringan', 'error')
    } finally {
      setJoining(false)
    }
  }

  // Submit team creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComp) return

    setJoining(true)
    try {
      const res = await fetch('/api/participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId: selectedComp.id, teamName }),
      })
      const data = await res.json()

      if (res.ok) {
        addToast('Tim berhasil dibuat!', 'success')
        setIsTeamModalOpen(false)
        setCreatedInviteCode(data.inviteCode)
        setInviteCodeModalOpen(true)

        // Mark as joined locally
        joinedCompIds.push(selectedComp.id)
        setSelectedComp((prev) => (prev ? { ...prev, isJoined: true } : null))
        setCompetitions((prev) =>
          prev.map((c) => (c.id === selectedComp.id ? { ...c, isJoined: true } : c))
        )
        router.refresh()
      } else {
        addToast(data.error || 'Gagal membuat tim', 'error')
      }
    } catch (err) {
      addToast('Terjadi kesalahan jaringan', 'error')
    } finally {
      setJoining(false)
    }
  }

  // Join Team via Invite Code
  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim() || !selectedComp) return
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
        
        // Mark as joined
        joinedCompIds.push(selectedComp.id)
        setSelectedComp((prev) => (prev ? { ...prev, isJoined: true } : null))
        setCompetitions((prev) =>
          prev.map((c) => (c.id === selectedComp.id ? { ...c, isJoined: true } : c))
        )
        router.refresh()
      } else {
        addToast(data.error || 'Kode undangan tidak valid.', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setJoining(false)
    }
  }

  // Format Helper for dates
  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast('Kode undangan disalin!', 'success')
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      {/* Header Section */}
      <div className="page-header">
        <h1>
          <i className="fa-solid fa-compass text-red"></i> Eksplorasi Kompetisi
        </h1>
        <p>Temukan wadah kompetisi terbaik yang selaras dengan kapabilitas bakatmu.</p>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px' }}>
        <div className="search-bar" style={{ marginBottom: '14px' }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Ketik tajuk kompetisi yang dicari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="filter-chips" style={{ marginBottom: '14px' }}>
          <button
            className={`filter-chip ${activeChip === 'all' ? 'active' : ''}`}
            onClick={() => setActiveChip('all')}
          >
            Semua Lomba
          </button>
          <button
            className={`filter-chip ${activeChip === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveChip('trending')}
          >
            <i className="fa-solid fa-fire text-yellow"></i> Populer / Tren
          </button>
          <button
            className={`filter-chip ${activeChip === 'newest' ? 'active' : ''}`}
            onClick={() => setActiveChip('newest')}
          >
            <i className="fa-solid fa-clock-rotate-left"></i> Rilis Terbaru
          </button>
          <button
            className={`filter-chip ${activeChip === 'national' ? 'active' : ''}`}
            onClick={() => setActiveChip('national')}
          >
            <i className="fa-solid fa-flag text-red"></i> Skala Nasional
          </button>
          <button
            className={`filter-chip ${activeChip === 'deadline' ? 'active' : ''}`}
            onClick={() => setActiveChip('deadline')}
          >
            <i className="fa-solid fa-hourglass-half"></i> Batas Waktu Terdekat
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="explore-filters">
          <div>
            <select
              className="form-select"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="form-select"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
            >
              <option value="">Semua Bidang</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="form-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">Semua Cakupan Tingkat</option>
              <option value="sekolah">Sekolah</option>
              <option value="kota">Kota/Kabupaten</option>
              <option value="provinsi">Provinsi</option>
              <option value="nasional">Nasional</option>
              <option value="internasional">Internasional</option>
            </select>
          </div>
          <div>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Semua Tipe Partisipan</option>
              <option value="solo">Individu (Solo)</option>
              <option value="team">Kelompok (Tim)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="explore-layout">
        {/* Left Column: Grid Cards */}
        <div>
          {loadingList ? (
            <div className="loading-center">
              <div className="spinner"></div>
            </div>
          ) : competitions.length > 0 ? (
            <>
              <div className="bento-grid bento-2">
                {competitions.map((comp) => (
                  <CompCard
                    key={comp.id}
                    id={comp.id}
                    title={comp.title}
                    category={comp.category}
                    organizer={comp.organizer}
                    level={comp.level}
                    type={comp.type}
                    deadline={formatDateStr(comp.deadline)}
                    poster={comp.poster}
                    linkRegistration={comp.linkRegistration}
                    isSelected={selectedComp?.id === comp.id}
                    onClick={() => fetchCompDetail(comp.id)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={pagination.page === 1}
                    onClick={() => fetchCompetitions(pagination.page - 1)}
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`page-btn ${pagination.page === page ? 'active' : ''}`}
                      onClick={() => fetchCompetitions(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchCompetitions(pagination.page + 1)}
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-regular fa-folder-open"></i>
                <h3>Tidak ada kompetisi ditemukan</h3>
                <p>Cobalah untuk menyesuaikan preferensi atau kata kunci pencarian Anda.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detail Panel */}
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h3 className="section-title">
              <i className="fa-regular fa-file-lines text-red"></i> Rincian Lomba
            </h3>
          </div>

          <div className="detail-panel-body">
            {loadingDetail ? (
              <div className="loading-center" style={{ padding: '40px' }}>
                <div className="spinner"></div>
              </div>
            ) : selectedComp ? (
              <div>
                {(() => {
                  const posters = selectedComp.poster
                    ? selectedComp.poster.split(/(?<!base64),/).map((p) => p.trim()).filter(Boolean)
                    : [];
                  if (posters.length > 0) {
                    const activePoster = posters[currentPosterIdx] || posters[0];
                    const srcUrl = (activePoster.startsWith('/') || activePoster.startsWith('http') || activePoster.startsWith('data:'))
                      ? activePoster
                      : `/images/posters/${activePoster}`;
                    return (
                      <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '16px', background: 'var(--gray-light)', boxShadow: 'var(--shadow-sm)' }}>
                        <img
                          src={srcUrl}
                          alt={`${selectedComp.title} poster ${currentPosterIdx + 1}`}
                          style={{ width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                        />
                        {posters.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPosterIdx((prev) => (prev === 0 ? posters.length - 1 : prev - 1));
                              }}
                              style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.85)',
                                border: 'none',
                                boxShadow: 'var(--shadow-sm)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                                zIndex: 10
                              }}
                            >
                              <i className="fa-solid fa-chevron-left" style={{ color: 'var(--dark)', fontSize: '0.75rem' }}></i>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPosterIdx((prev) => (prev === posters.length - 1 ? 0 : prev + 1));
                              }}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.85)',
                                border: 'none',
                                boxShadow: 'var(--shadow-sm)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                                zIndex: 10
                              }}
                            >
                              <i className="fa-solid fa-chevron-right" style={{ color: 'var(--dark)', fontSize: '0.75rem' }}></i>
                            </button>
                            <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 10 }}>
                              {posters.map((_, dotIdx) => (
                                <button
                                  key={dotIdx}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setCurrentPosterIdx(dotIdx); }}
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    padding: 0,
                                    background: currentPosterIdx === dotIdx ? 'var(--red)' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                  }}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div
                      className="detail-panel-poster"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${selectedComp.category.color}15, ${selectedComp.category.color}30)`,
                        fontSize: '3rem',
                        color: selectedComp.category.color,
                        marginBottom: '16px',
                      }}
                    >
                      <i className={`fa-solid ${selectedComp.category.icon}`}></i>
                    </div>
                  );
                })()}

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px' }}>
                  {selectedComp.title}
                </h3>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--gray)',
                    marginBottom: '14px',
                  }}
                >
                  Penyelenggara: <strong style={{ color: 'var(--dark)' }}>{selectedComp.organizer}</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '18px',
                  }}
                >
                  <span
                    className="badge-pill"
                    style={{
                      background: `${selectedComp.category.color}15`,
                      color: selectedComp.category.color,
                    }}
                  >
                    <i className={`fa-solid ${selectedComp.category.icon}`}></i> {selectedComp.category.name}
                  </span>
                  <span className="badge-pill bg-blue-light text-blue">
                    <i className="fa-solid fa-users"></i> {selectedComp.type === 'team' ? 'Kelompok' : 'Individu'}
                  </span>
                  <span className="badge-pill bg-yellow-light text-yellow">
                    <i className="fa-solid fa-layer-group"></i> {selectedComp.level}
                  </span>
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>DESKRIPSI</div>
                    <div
                      style={{ fontSize: '0.8rem', color: 'var(--gray-dark)', lineHeight: 1.5, marginTop: '2px' }}
                    >
                      {selectedComp.description || 'Tidak ada deskripsi.'}
                    </div>
                  </div>

                  {selectedComp.requirements && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>PERSYARATAN</div>
                      <div
                        style={{ fontSize: '0.8rem', color: 'var(--gray-dark)', lineHeight: 1.5, marginTop: '2px' }}
                      >
                        {selectedComp.requirements}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>DEADLINE UTAMA</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>
                        {formatDateStr(selectedComp.deadline)}
                      </div>
                    </div>
                    {selectedComp.registerDeadline && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>
                          DEADLINE DAFTAR
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '2px' }}>
                          {formatDateStr(selectedComp.registerDeadline)}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedComp.type === 'team' && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>BATAS ANGGOTA</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--dark)', marginTop: '2px' }}>
                        Minimal {selectedComp.minMembers} &amp; Maksimal {selectedComp.maxMembers} anggota tim
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {selectedComp.guidebookLink && (
                      <a
                        href={selectedComp.guidebookLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                      >
                        <i className="fa-solid fa-file-pdf"></i> Guidebook
                      </a>
                    )}
                    {selectedComp.linkRegistration && (
                      <a
                        href={selectedComp.linkRegistration}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                      >
                        <i className="fa-solid fa-up-right-from-square"></i> Link Eksternal
                      </a>
                    )}
                  </div>
                </div>

                {/* Join CTA */}
                {(() => {
                  const isPassed = new Date(selectedComp.deadline).getTime() < new Date().setHours(0,0,0,0);
                  if (selectedComp.isJoined) {
                    return (
                      <button className="btn btn-secondary btn-block" disabled>
                        <i className="fa-solid fa-circle-check text-green"></i> Anda Sudah Terdaftar
                      </button>
                    );
                  }
                  if (isPassed) {
                    return (
                      <div style={{ width: '100%', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '6px' }}></i> Batas pendaftaran telah terlampaui (Tutup)
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={handleJoin}
                        disabled={joining}
                      >
                      {joining ? (
                        <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                      ) : selectedComp.type === 'team' ? (
                        <>
                          <i className="fa-solid fa-plus"></i> Buat Tim Baru
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-arrow-right-to-bracket"></i> Ikuti Lomba (Solo)
                        </>
                      )}
                    </button>
                    {selectedComp.type === 'team' && (
                      <button
                        className="btn btn-outline"
                        style={{ flex: 1 }}
                        onClick={() => setIsJoinTeamModalOpen(true)}
                        disabled={joining}
                      >
                        <i className="fa-solid fa-right-to-bracket"></i> Gabung Tim
                      </button>
                    )}
                  </div>
                );
              })()}
              </div>
            ) : (
              <div className="detail-panel-empty">
                <i className="fa-solid fa-hand-pointer"></i>
                <h3>Pilih Entitas Kompetisi</h3>
                <p>Klik salah satu kartu di panel kiri untuk memuat spesifikasi data secara lengkap.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Modal */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        title="Buat Tim Baru"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsTeamModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateTeam} disabled={joining || !teamName.trim()}>
              {joining ? 'Membuat...' : 'Buat & Gabung'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTeam}>
          <div className="form-group">
            <label className="form-label">Nama Tim</label>
            <input
              type="text"
              className="form-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Masukkan nama tim Anda..."
              required
              autoFocus
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.4 }}>
            Membuat tim akan menghasilkan <strong>Kode Undangan</strong> unik. Bagikan kode tersebut kepada teman seangkatan/kelas agar mereka dapat bergabung ke dalam tim ini.
          </p>
        </form>
      </Modal>

      {/* Invite Code Modal */}
      <Modal
        isOpen={inviteCodeModalOpen}
        onClose={() => setInviteCodeModalOpen(false)}
        title="Tim Berhasil Dibuat!"
        footer={
          <button className="btn btn-primary btn-sm" onClick={() => setInviteCodeModalOpen(false)}>
            Selesai
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '14px', color: 'var(--red)' }}><i className="fa-solid fa-share-nodes"></i></div>
          <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Bagikan Kode Undangan Anda</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: '18px' }}>
            Teman tim Anda dapat memasukkan kode ini pada menu <strong>Eksplor Lomba</strong> atau <strong>Gabung Tim</strong>.
          </p>

          <div
            style={{
              background: 'var(--gray-light)',
              padding: '16px',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              border: '1.5px dashed var(--gray-mid)',
              marginBottom: '10px',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--red)' }}>
              {createdInviteCode}
            </span>
            <button
              className="btn btn-icon btn-secondary"
              title="Salin Kode"
              onClick={() => copyToClipboard(createdInviteCode)}
              style={{ width: '32px', height: '32px' }}
            >
              <i className="fa-solid fa-copy"></i>
            </button>
          </div>
        </div>
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
