'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CompCard } from '@/components/ui/CompCard'
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
}

interface Props {
  initialCompetitions: CompetitionData[]
  categories: Category[]
  fields: Field[]
}

type ChipFilter = 'all' | 'trending' | 'newest' | 'national' | 'deadline'

export function TeacherExploreClient({
  initialCompetitions,
  categories,
  fields,
}: Props) {
  const searchParams = useSearchParams()
  const { addToast, ToastContainer } = useToast()

  const [competitions, setCompetitions] = useState<CompetitionData[]>(initialCompetitions)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: initialCompetitions.length,
    totalPages: 1,
  })

  const [selectedComp, setSelectedComp] = useState<CompetitionData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [currentPosterIdx, setCurrentPosterIdx] = useState(0)

  useEffect(() => {
    setCurrentPosterIdx(0)
  }, [selectedComp?.id])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeChip, setActiveChip] = useState<ChipFilter>('all')
  const [selectedCat, setSelectedCat] = useState('')
  const [selectedField, setSelectedField] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [loadingList, setLoadingList] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      const compId = parseInt(idParam)
      const found = initialCompetitions.find((c) => c.id === compId)
      if (found) {
        setSelectedComp(found)
      } else {
        fetchCompDetail(compId)
      }
    } else if (initialCompetitions.length > 0) {
      setSelectedComp(initialCompetitions[0])
    }
  }, [searchParams])

  const fetchCompDetail = async (compId: number) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/competitions/${compId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedComp(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

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
        setCompetitions(data.competitions)
        setPagination(data.pagination)

        if (data.competitions.length > 0) {
          const hasUrlId = searchParams.get('id')
          if (hasUrlId) {
            // If the URL specifies an ID, try to find it in the new list to keep details in sync
            const matchingComp = data.competitions.find((c: any) => c.id === parseInt(hasUrlId))
            if (matchingComp) {
              setSelectedComp(matchingComp)
            }
            // Otherwise, do not override selectedComp (leave it to fetchCompDetail)
          } else {
            // Standard fallback: select first if no active select or previous select is gone
            const isPreviousInList = data.competitions.find((c: any) => c.id === selectedComp?.id)
            if (!selectedComp || !isPreviousInList) {
              setSelectedComp(data.competitions[0])
            }
          }
        } else {
          setSelectedComp(null)
        }
      }
    } catch (err) {
      addToast('Gagal memuat kompetisi', 'error')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchCompetitions(1)
  }, [debouncedSearch, activeChip, selectedCat, selectedField, selectedLevel, selectedType])

  const handleShare = () => {
    if (!selectedComp) return
    const shareUrl = `${window.location.origin}/student/explore?id=${selectedComp.id}`
    navigator.clipboard.writeText(shareUrl)
    addToast('Link pendaftaran kompetisi disalin! Siap dibagikan ke siswa.', 'success')
  }

  const formatDateStr = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      <div className="page-header">
        <h1>
          <i className="fa-solid fa-compass text-red"></i> Eksplorasi Lomba (Guru)
        </h1>
        <p>Tinjau daftar lomba terposting dan bagikan link kompetisi langsung kepada siswa-siswi bimbingan Anda.</p>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px' }}>
        <div className="search-bar" style={{ marginBottom: '14px' }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Cari lomba untuk dibagikan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chips */}
        <div className="filter-chips" style={{ marginBottom: '14px' }}>
          <button className={`filter-chip ${activeChip === 'all' ? 'active' : ''}`} onClick={() => setActiveChip('all')}>
            Semua Lomba
          </button>
          <button className={`filter-chip ${activeChip === 'trending' ? 'active' : ''}`} onClick={() => setActiveChip('trending')}>
            <i className="fa-solid fa-fire text-yellow"></i> Populer
          </button>
          <button className={`filter-chip ${activeChip === 'newest' ? 'active' : ''}`} onClick={() => setActiveChip('newest')}>
            <i className="fa-solid fa-clock-rotate-left"></i> Terbaru
          </button>
          <button className={`filter-chip ${activeChip === 'national' ? 'active' : ''}`} onClick={() => setActiveChip('national')}>
            <i className="fa-solid fa-flag text-red"></i> Nasional
          </button>
          <button className={`filter-chip ${activeChip === 'deadline' ? 'active' : ''}`} onClick={() => setActiveChip('deadline')}>
            <i className="fa-solid fa-hourglass-half"></i> Deadline Terdekat
          </button>
        </div>

        {/* Dropdowns */}
        <div className="explore-filters">
          <select className="form-select" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="form-select" value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
            <option value="">Semua Bidang</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>

          <select className="form-select" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
            <option value="">Semua Tingkat</option>
            <option value="sekolah">Sekolah</option>
            <option value="kota">Kota/Kabupaten</option>
            <option value="provinsi">Provinsi</option>
            <option value="nasional">Nasional</option>
            <option value="internasional">Internasional</option>
          </select>

          <select className="form-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">Semua Tipe</option>
            <option value="solo">Individu (Solo)</option>
            <option value="team">Kelompok (Tim)</option>
          </select>
        </div>
      </div>

      {/* Main Layout */}
      <div className="explore-layout">
        <div>
          {loadingList ? (
            <div className="loading-center"><div className="spinner"></div></div>
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
            </>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-regular fa-folder-open"></i>
                <h3>Tidak ada kompetisi ditemukan</h3>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h3 className="section-title"><i className="fa-regular fa-file-lines text-red"></i> Detail Lomba</h3>
          </div>
          <div className="detail-panel-body">
            {loadingDetail ? (
              <div className="loading-center"><div className="spinner"></div></div>
            ) : selectedComp ? (
              <div>
                {(() => {
                  const posters = selectedComp.poster
                    ? selectedComp.poster.split(',').map((p) => p.trim()).filter(Boolean)
                    : [];
                  if (posters.length > 0) {
                    const activePoster = posters[currentPosterIdx] || posters[0];
                    const srcUrl = (activePoster.startsWith('/') || activePoster.startsWith('http'))
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

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '4px' }}>{selectedComp.title}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray)', marginBottom: '14px' }}>
                  Penyelenggara: <strong>{selectedComp.organizer}</strong>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  <span className="badge-pill" style={{ background: `${selectedComp.category.color}15`, color: selectedComp.category.color }}>
                    <i className={`fa-solid ${selectedComp.category.icon}`}></i> {selectedComp.category.name}
                  </span>
                  <span className="badge-pill bg-blue-light text-blue">{selectedComp.type === 'team' ? 'Kelompok' : 'Individu'}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>DESKRIPSI</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-dark)', lineHeight: 1.5 }}>{selectedComp.description || 'Tidak ada deskripsi.'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontWeight: 600 }}>DEADLINE UTAMA</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)' }}>{formatDateStr(selectedComp.deadline)}</div>
                  </div>
                </div>

                <button className="btn btn-primary btn-block" onClick={handleShare}>
                  <i className="fa-solid fa-share-nodes"></i> Bagikan Link Ke Siswa
                </button>
              </div>
            ) : (
              <div className="detail-panel-empty">
                <i className="fa-solid fa-hand-pointer"></i>
                <h3>Pilih Lomba</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
