'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

interface CompetitionItem {
  id: number
  title: string
  organizer: string
  level: string
  type: string
  maxMembers: number
  minMembers: number
  deadline: string
  isTrending: boolean
  isActive: boolean
  categoryName: string
  categoryColor: string
  fieldName: string
  categoryId?: number
  fieldId?: number
  description?: string | null
  requirements?: string | null
  linkRegistration?: string | null
  guidebookLink?: string | null
  poster?: string | null
}

interface Selection {
  id: number
  name: string
  categoryId?: number | null
}

interface Props {
  initialCompetitions: CompetitionItem[]
  categories: Selection[]
  fields: Selection[]
}

export function AdminCompetitionsClient({
  initialCompetitions,
  categories,
  fields
}: Props) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [competitions, setCompetitions] = useState<CompetitionItem[]>(initialCompetitions)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Modal: Add Competition
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [organizer, setOrganizer] = useState('')
  const [selectedCatId, setSelectedCatId] = useState('')
  const [selectedFieldId, setSelectedFieldId] = useState('')
  const [level, setLevel] = useState('nasional')
  const [type, setType] = useState('solo')
  const [maxMembers, setMaxMembers] = useState('3')
  const [minMembers, setMinMembers] = useState('1')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [linkRegistration, setLinkRegistration] = useState('')
  const [guidebookLink, setGuidebookLink] = useState('')
  const [deadline, setDeadline] = useState('')
  const [posterUrls, setPosterUrls] = useState('')
  const [isTrending, setIsTrending] = useState(false)

  // Modal: Edit Competition
  const [editingComp, setEditingComp] = useState<CompetitionItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editOrganizer, setEditOrganizer] = useState('')
  const [editCatId, setEditCatId] = useState('')
  const [editFieldId, setEditFieldId] = useState('')
  const [editLevel, setEditLevel] = useState('nasional')
  const [editType, setEditType] = useState('solo')
  const [editMaxMembers, setEditMaxMembers] = useState('3')
  const [editMinMembers, setEditMinMembers] = useState('1')
  const [editDescription, setEditDescription] = useState('')
  const [editRequirements, setEditRequirements] = useState('')
  const [editLinkRegistration, setEditLinkRegistration] = useState('')
  const [editGuidebookLink, setEditGuidebookLink] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editPosterUrls, setEditPosterUrls] = useState('')
  const [editIsTrending, setEditIsTrending] = useState(false)
  const [editIsActive, setEditIsActive] = useState(true)

  const handleFetchComps = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/competitions')
      if (res.ok) {
        const data = await res.json()
        const formatted = data.competitions.map((c: any) => ({
          id: c.id,
          title: c.title,
          organizer: c.organizer,
          level: c.level,
          type: c.type,
          maxMembers: c.maxMembers,
          minMembers: c.minMembers,
          deadline: c.deadline,
          isTrending: c.isTrending,
          isActive: c.isActive,
          categoryName: c.category.name,
          categoryColor: c.category.color,
          fieldName: c.field.name,
          categoryId: c.categoryId,
          fieldId: c.fieldId,
          description: c.description,
          requirements: c.requirements,
          linkRegistration: c.linkRegistration,
          guidebookLink: c.guidebookLink,
          poster: c.poster
        }))
        setCompetitions(formatted)
      }
    } catch {
      addToast('Gagal memuat ulang kompetisi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          organizer,
          categoryId: selectedCatId,
          fieldId: selectedFieldId,
          level,
          type,
          maxMembers,
          minMembers,
          description,
          requirements,
          linkRegistration,
          guidebookLink,
          deadline,
          poster: posterUrls,
          isTrending
        })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Kompetisi baru berhasil diposting!', 'success')
        setIsAddModalOpen(false)
        setTitle('')
        setOrganizer('')
        setSelectedCatId('')
        setSelectedFieldId('')
        setDescription('')
        setRequirements('')
        setLinkRegistration('')
        setGuidebookLink('')
        setDeadline('')
        setPosterUrls('')
        setIsTrending(false)
        handleFetchComps()
        router.refresh()
      } else {
        addToast(data.error || 'Gagal menyimpan kompetisi', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (comp: CompetitionItem) => {
    setEditingComp(comp)
    setEditTitle(comp.title)
    setEditOrganizer(comp.organizer)
    setEditCatId(String(comp.categoryId || ''))
    setEditFieldId(String(comp.fieldId || ''))
    setEditLevel(comp.level)
    setEditType(comp.type)
    setEditMaxMembers(String(comp.maxMembers))
    setEditMinMembers(String(comp.minMembers))
    setEditDescription(comp.description || '')
    setEditRequirements(comp.requirements || '')
    setEditLinkRegistration(comp.linkRegistration || '')
    setEditGuidebookLink(comp.guidebookLink || '')
    setEditDeadline(comp.deadline ? comp.deadline.substring(0, 10) : '')
    setEditPosterUrls(comp.poster || '')
    setEditIsTrending(comp.isTrending)
    setEditIsActive(comp.isActive)
  }

  const handleSaveEdit = async () => {
    if (!editingComp) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/competitions/${editingComp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          organizer: editOrganizer,
          categoryId: editCatId,
          fieldId: editFieldId,
          level: editLevel,
          type: editType,
          maxMembers: editMaxMembers,
          minMembers: editMinMembers,
          description: editDescription,
          requirements: editRequirements,
          linkRegistration: editLinkRegistration,
          guidebookLink: editGuidebookLink,
          deadline: editDeadline,
          poster: editPosterUrls,
          isTrending: editIsTrending,
          isActive: editIsActive
        })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Kompetisi berhasil diperbarui!', 'success')
        setEditingComp(null)
        handleFetchComps()
        router.refresh()
      } else {
        addToast(data.error || 'Gagal memperbarui kompetisi', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComp = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kompetisi ini? Semua data pendaftaran siswa di lomba ini akan ikut terhapus.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        addToast('Kompetisi berhasil dihapus.', 'success')
        setCompetitions(competitions.filter(c => c.id !== id))
        router.refresh()
      } else {
        const data = await res.json()
        addToast(data.error || 'Gagal menghapus kompetisi', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Filter list locally for search responsiveness
  const filteredComps = competitions.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.organizer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Dynamic Categories Filtering
  const filteredCategoriesForAdd = selectedFieldId
    ? categories.filter(c => String(c.id) === String(fields.find(f => String(f.id) === String(selectedFieldId))?.categoryId))
    : categories

  const filteredCategoriesForEdit = editFieldId
    ? categories.filter(c => String(c.id) === String(fields.find(f => String(f.id) === String(editFieldId))?.categoryId))
    : categories

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>
            <i className="fa-solid fa-trophy text-red"></i> Manajemen Kompetisi
          </h1>
          <p>Posting kompetisi eksternal baru, verifikasi status, dan edit detail info lomba.</p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
          <i className="fa-solid fa-plus"></i> Posting Lomba Baru
        </button>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Cari kompetisi berdasarkan judul atau penyelenggara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Competitions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredComps.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Judul Lomba</th>
                <th>Penyelenggara</th>
                <th>Tingkat &amp; Tipe</th>
                <th>Kategori &amp; Bidang</th>
                <th>Deadline Pendaftaran</th>
                <th>Trending</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredComps.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--dark)' }}>{c.title}</strong>
                  </td>
                  <td>{c.organizer}</td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.78rem', fontWeight: 600 }}>{c.level}</span>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--gray)' }}>{c.type === 'team' ? 'Kelompok' : 'Individu'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.62rem', background: `${c.categoryColor}15`, color: c.categoryColor, padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginBottom: '2px' }}>
                      {c.categoryName}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--gray)' }}>{c.fieldName}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 600 }}>
                      {new Date(c.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-pill ${c.isTrending ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: '0.68rem' }}>
                      {c.isTrending ? 'Trending' : 'Biasa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleOpenEdit(c)}>
                        <i className="fa-solid fa-pen" style={{ fontSize: '0.72rem' }}></i>
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeleteComp(c.id)}>
                        <i className="fa-solid fa-trash" style={{ fontSize: '0.72rem' }}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ padding: '40px' }}>
            <i className="fa-solid fa-trophy" style={{ fontSize: '3rem' }}></i>
            <h3>Tidak ada kompetisi ditemukan</h3>
          </div>
        )}
      </div>

      {/* Modal: Add Competition Form */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Posting Lomba Baru"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>Batal</button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || !title || !organizer || !selectedCatId || !selectedFieldId || !deadline}>
              Simpan &amp; Publish
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Judul Kompetisi</label>
            <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Penyelenggara</label>
            <input type="text" className="form-input" value={organizer} onChange={(e) => setOrganizer(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Bidang Lomba</label>
              <select
                className="form-select"
                value={selectedFieldId}
                onChange={(e) => {
                  const fId = e.target.value;
                  setSelectedFieldId(fId);
                  const parentCatId = fields.find(f => String(f.id) === String(fId))?.categoryId;
                  setSelectedCatId(parentCatId ? String(parentCatId) : '');
                }}
                required
              >
                <option value="">Pilih Bidang...</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kategori Lomba</label>
              <select className="form-select" value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} required>
                <option value="">Pilih Kategori...</option>
                {filteredCategoriesForAdd.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Cakupan Tingkat</label>
              <select className="form-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="sekolah">Sekolah</option>
                <option value="kota">Kota/Kabupaten</option>
                <option value="provinsi">Provinsi</option>
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipe Partisipasi</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="solo">Individu (Solo)</option>
                <option value="team">Kelompok (Tim)</option>
              </select>
            </div>
          </div>

          {type === 'team' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Minimal Anggota</label>
                <input type="number" className="form-input" value={minMembers} onChange={(e) => setMinMembers(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Maksimal Anggota</label>
                <input type="number" className="form-input" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Deskripsi Lomba</label>
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: '80px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Persyaratan Pendaftaran</label>
            <input type="text" className="form-input" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Misal: Siswa aktif, Mengumpulkan esai, dll." />
          </div>

          <div className="form-group">
            <label className="form-label">Link Pendaftaran Eksternal (Optional)</label>
            <input type="text" className="form-input" value={linkRegistration} onChange={(e) => setLinkRegistration(e.target.value)} placeholder="https://..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Link Guidebook (Optional)</label>
              <input type="text" className="form-input" value={guidebookLink} onChange={(e) => setGuidebookLink(e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Batas Waktu (Deadline)</label>
              <input type="date" className="form-input" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Poster Lomba (JPG/PNG)</label>
            {posterUrls ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                {posterUrls.split(',').map(url => url.trim()).filter(Boolean).map((url, idx) => {
                  const srcUrl = (url.startsWith('/') || url.startsWith('http')) ? url : `/images/posters/${url}`;
                  return (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--gray-mid)', boxShadow: 'var(--shadow-sm)' }}>
                      <img src={srcUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster preview" />
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = posterUrls.split(',').map(u => u.trim()).filter(Boolean).filter((_, i) => i !== idx);
                          setPosterUrls(remaining.join(', '));
                        }}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(227, 30, 37, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          lineHeight: 1
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--gray-mid)', borderRadius: 'var(--radius)', padding: '20px', cursor: 'pointer', background: 'var(--gray-light)', transition: 'border-color 0.2s', textAlign: 'center' }}>
              <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.5rem', color: 'var(--gray)', marginBottom: '8px' }}></i>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark)' }}>Klik untuk unggah gambar poster (Bisa multi-select)</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--gray)', marginTop: '2px' }}>Hanya format JPG atau PNG</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = e.target.files
                  if (!files || files.length === 0) return
                  
                  addToast(`Mengunggah ${files.length} poster...`, 'info')
                  const uploadedUrls = []
                  
                  for (let i = 0; i < files.length; i++) {
                    const fd = new FormData()
                    fd.append('file', files[i])
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const data = await res.json()
                      if (res.ok) {
                        uploadedUrls.push(data.url)
                      }
                    } catch (err) {
                      console.error('Failed to upload poster', err)
                    }
                  }
                  
                  if (uploadedUrls.length > 0) {
                    const newPosterStr = posterUrls ? `${posterUrls}, ${uploadedUrls.join(', ')}` : uploadedUrls.join(', ')
                    setPosterUrls(newPosterStr)
                    addToast('Poster berhasil diunggah!', 'success')
                  } else {
                    addToast('Gagal mengunggah poster.', 'error')
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            <label className="form-label" style={{ marginBottom: 0 }}>Tampilkan sebagai Lomba Trending (Populer)</label>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Competition Form */}
      {editingComp && (
        <Modal
          isOpen={!!editingComp}
          onClose={() => setEditingComp(null)}
          title="Ubah Detail Kompetisi"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingComp(null)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={loading || !editTitle || !editOrganizer || !editCatId || !editFieldId || !editDeadline}>
                Simpan Perubahan
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Judul Kompetisi</label>
            <input type="text" className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Penyelenggara</label>
            <input type="text" className="form-input" value={editOrganizer} onChange={(e) => setEditOrganizer(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Bidang Lomba</label>
              <select
                className="form-select"
                value={editFieldId}
                onChange={(e) => {
                  const fId = e.target.value;
                  setEditFieldId(fId);
                  const parentCatId = fields.find(f => String(f.id) === String(fId))?.categoryId;
                  setEditCatId(parentCatId ? String(parentCatId) : '');
                }}
                required
              >
                <option value="">Pilih Bidang...</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kategori Lomba</label>
              <select className="form-select" value={editCatId} onChange={(e) => setEditCatId(e.target.value)} required>
                <option value="">Pilih Kategori...</option>
                {filteredCategoriesForEdit.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Cakupan Tingkat</label>
              <select className="form-select" value={editLevel} onChange={(e) => setEditLevel(e.target.value)}>
                <option value="sekolah">Sekolah</option>
                <option value="kota">Kota/Kabupaten</option>
                <option value="provinsi">Provinsi</option>
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipe Partisipasi</label>
              <select className="form-select" value={editType} onChange={(e) => setEditType(e.target.value)}>
                <option value="solo">Individu (Solo)</option>
                <option value="team">Kelompok (Tim)</option>
              </select>
            </div>
          </div>

          {editType === 'team' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Minimal Anggota</label>
                <input type="number" className="form-input" value={editMinMembers} onChange={(e) => setEditMinMembers(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Maksimal Anggota</label>
                <input type="number" className="form-input" value={editMaxMembers} onChange={(e) => setEditMaxMembers(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Deskripsi Lomba</label>
            <textarea className="form-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ minHeight: '80px' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Persyaratan Pendaftaran</label>
            <input type="text" className="form-input" value={editRequirements} onChange={(e) => setEditRequirements(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Link Pendaftaran Eksternal (Optional)</label>
            <input type="text" className="form-input" value={editLinkRegistration} onChange={(e) => setEditLinkRegistration(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Link Guidebook (Optional)</label>
              <input type="text" className="form-input" value={editGuidebookLink} onChange={(e) => setEditGuidebookLink(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Batas Waktu (Deadline)</label>
              <input type="date" className="form-input" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Poster Lomba (JPG/PNG)</label>
            {editPosterUrls ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                {editPosterUrls.split(',').map(url => url.trim()).filter(Boolean).map((url, idx) => {
                  const srcUrl = (url.startsWith('/') || url.startsWith('http')) ? url : `/images/posters/${url}`;
                  return (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--gray-mid)', boxShadow: 'var(--shadow-sm)' }}>
                      <img src={srcUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster preview" />
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = editPosterUrls.split(',').map(u => u.trim()).filter(Boolean).filter((_, i) => i !== idx);
                          setEditPosterUrls(remaining.join(', '));
                        }}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(227, 30, 37, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          lineHeight: 1
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--gray-mid)', borderRadius: 'var(--radius)', padding: '20px', cursor: 'pointer', background: 'var(--gray-light)', transition: 'border-color 0.2s', textAlign: 'center' }}>
              <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.5rem', color: 'var(--gray)', marginBottom: '8px' }}></i>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark)' }}>Klik untuk unggah gambar poster (Bisa multi-select)</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--gray)', marginTop: '2px' }}>Hanya format JPG atau PNG</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={async (e) => {
                  const files = e.target.files
                  if (!files || files.length === 0) return
                  
                  addToast(`Mengunggah ${files.length} poster...`, 'info')
                  const uploadedUrls = []
                  
                  for (let i = 0; i < files.length; i++) {
                    const fd = new FormData()
                    fd.append('file', files[i])
                    try {
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const data = await res.json()
                      if (res.ok) {
                        uploadedUrls.push(data.url)
                      }
                    } catch (err) {
                      console.error('Failed to upload poster', err)
                    }
                  }
                  
                  if (uploadedUrls.length > 0) {
                    const newPosterStr = editPosterUrls ? `${editPosterUrls}, ${uploadedUrls.join(', ')}` : uploadedUrls.join(', ')
                    setEditPosterUrls(newPosterStr)
                    addToast('Poster berhasil diunggah!', 'success')
                  } else {
                    addToast('Gagal mengunggah poster.', 'error')
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
              <input type="checkbox" checked={editIsTrending} onChange={(e) => setEditIsTrending(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label className="form-label" style={{ marginBottom: 0 }}>Tampilkan sebagai Lomba Trending</label>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
              <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label className="form-label" style={{ marginBottom: 0 }}>Aktif / Tampilkan Post Lomba</label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
