'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

interface CategoryItem {
  id: number
  name: string
  icon: string
  color: string
}

interface FieldItem {
  id: number
  name: string
  icon: string
  categoryId?: number | null
}

interface Props {
  categories: CategoryItem[]
  fields: FieldItem[]
}

export function AdminCategoriesClient({ categories: initialCats, fields: initialFields }: Props) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [categories, setCategories] = useState<CategoryItem[]>(initialCats)
  const [fields, setFields] = useState<FieldItem[]>(initialFields)

  // Creation States
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('fa-trophy')
  const [catColor, setCatColor] = useState('#e31e25')

  const [fieldName, setFieldName] = useState('')
  const [fieldIcon, setFieldIcon] = useState('fa-star')
  const [fieldCatId, setFieldCatId] = useState('')

  const [savingCat, setSavingCat] = useState(false)
  const [savingField, setSavingField] = useState(false)

  // Edit States
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatIcon, setEditCatIcon] = useState('')
  const [editCatColor, setEditCatColor] = useState('')

  const [editingField, setEditingField] = useState<FieldItem | null>(null)
  const [editFieldName, setEditFieldName] = useState('')
  const [editFieldIcon, setEditFieldIcon] = useState('')
  const [editFieldCatId, setEditFieldCatId] = useState('')

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCat(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, icon: catIcon, color: catColor })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Kategori baru berhasil dibuat!', 'success')
        setCatName('')
        setCatIcon('fa-trophy')
        setCatColor('#e31e25')
        setCategories([...categories, data.category])
        router.refresh()
      } else {
        addToast(data.error || 'Gagal menyimpan kategori', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setSavingCat(false)
    }
  }

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingField(true)
    try {
      const res = await fetch('/api/admin/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: fieldName, 
          icon: fieldIcon,
          categoryId: fieldCatId ? parseInt(fieldCatId) : null
        })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Bidang baru berhasil dibuat!', 'success')
        setFieldName('')
        setFieldIcon('fa-star')
        setFieldCatId('')
        setFields([...fields, data.field])
        router.refresh()
      } else {
        addToast(data.error || 'Gagal menyimpan bidang', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setSavingField(false)
    }
  }

  // Category Edit and Delete
  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCat(cat)
    setEditCatName(cat.name)
    setEditCatIcon(cat.icon)
    setEditCatColor(cat.color)
  }

  const handleSaveEditCategory = async () => {
    if (!editingCat) return
    try {
      const res = await fetch(`/api/admin/categories/${editingCat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCatName, icon: editCatIcon, color: editCatColor })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Kategori berhasil diperbarui!', 'success')
        setCategories(categories.map(c => c.id === editingCat.id ? data.category : c))
        setEditingCat(null)
        router.refresh()
      } else {
        addToast(data.error || 'Gagal merubah kategori', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini? Semua kompetisi di kategori ini akan kehilangan relasinya.')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        addToast('Kategori berhasil dihapus.', 'success')
        setCategories(categories.filter(c => c.id !== id))
        router.refresh()
      } else {
        const data = await res.json()
        addToast(data.error || 'Gagal menghapus kategori', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    }
  }

  // Field Edit and Delete
  const handleOpenEditField = (field: FieldItem) => {
    setEditingField(field)
    setEditFieldName(field.name)
    setEditFieldIcon(field.icon)
    setEditFieldCatId(field.categoryId ? String(field.categoryId) : '')
  }

  const handleSaveEditField = async () => {
    if (!editingField) return
    try {
      const res = await fetch(`/api/admin/fields/${editingField.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editFieldName, 
          icon: editFieldIcon,
          categoryId: editFieldCatId ? parseInt(editFieldCatId) : null
        })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Bidang berhasil diperbarui!', 'success')
        setFields(fields.map(f => f.id === editingField.id ? data.field : f))
        setEditingField(null)
        router.refresh()
      } else {
        addToast(data.error || 'Gagal merubah bidang', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    }
  }

  const handleDeleteField = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bidang ini? Semua kompetisi di bidang ini akan kehilangan relasinya.')) return
    try {
      const res = await fetch(`/api/admin/fields/${id}`, { method: 'DELETE' })
      if (res.ok) {
        addToast('Bidang berhasil dihapus.', 'success')
        setFields(fields.filter(f => f.id !== id))
        router.refresh()
      } else {
        const data = await res.json()
        addToast(data.error || 'Gagal menghapus bidang', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    }
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      <div className="page-header">
        <h1>
          <i className="fa-solid fa-tags text-red"></i> Pengaturan Kategori &amp; Bidang Lomba
        </h1>
        <p>
          Tambah, ubah, dan hapus kategori serta bidang lomba. Panduan ikon silakan merujuk ke{' '}
          <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noreferrer" style={{ color: 'var(--red)', textDecoration: 'underline', fontWeight: 700 }}>
            Font Awesome Free Icons <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </a>.
        </p>
      </div>

      <div className="bento-grid bento-2">
        {/* Left Card: Categories list + form */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-trophy text-red" style={{ marginRight: '6px' }}></i> Kategori Lomba
          </h3>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--gray-light)' }}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Nama Kategori</label>
              <input type="text" className="form-input" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Contoh: Olimpiade, Hackathon, Seni" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">
                  Icon (FontAwesome) <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noreferrer" style={{ fontSize: '0.68rem', color: 'var(--blue)', textDecoration: 'underline', marginLeft: '4px' }}><i className="fa-solid fa-arrow-up-right-from-square"></i> Panduan Ikon</a>
                </label>
                <input type="text" className="form-input" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} placeholder="fa-trophy" />
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Hex Color</label>
                <input type="color" className="form-input" value={catColor} onChange={(e) => setCatColor(e.target.value)} style={{ padding: '4px', height: '40px' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-sm btn-block" disabled={savingCat}>
              {savingCat ? 'Menyimpan...' : 'Tambah Kategori'}
            </button>
          </form>

          {/* List display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {categories.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${c.color}15`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa-solid ${c.icon}`}></i>
                  </div>
                  <strong style={{ fontSize: '0.8rem' }}>{c.name}</strong>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleOpenEditCategory(c)}>
                    <i className="fa-solid fa-pen" style={{ fontSize: '0.72rem' }}></i>
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeleteCategory(c.id)}>
                    <i className="fa-solid fa-trash" style={{ fontSize: '0.72rem' }}></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Fields list + form */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-star text-yellow" style={{ marginRight: '6px' }}></i> Bidang Lomba
          </h3>

          <form onSubmit={handleAddField} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--gray-light)' }}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Nama Bidang</label>
              <input type="text" className="form-input" value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="Contoh: Web Development, Desain Poster" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">
                  Ikon (FontAwesome) <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noreferrer" style={{ fontSize: '0.68rem', color: 'var(--blue)', textDecoration: 'underline', marginLeft: '4px' }}><i className="fa-solid fa-arrow-up-right-from-square"></i> Panduan Ikon</a>
                </label>
                <input type="text" className="form-input" value={fieldIcon} onChange={(e) => setFieldIcon(e.target.value)} placeholder="fa-star" />
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Relasi Kategori</label>
                <select className="form-select" value={fieldCatId} onChange={(e) => setFieldCatId(e.target.value)}>
                  <option value="">Pilih Kategori...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-sm btn-block" disabled={savingField}>
              {savingField ? 'Menyimpan...' : 'Tambah Bidang'}
            </button>
          </form>

          {/* List display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {fields.map((f) => {
              const catObj = categories.find(c => c.id === f.categoryId)
              return (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', border: '1px solid var(--gray-light)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray-light)', color: 'var(--gray-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa-solid ${f.icon}`}></i>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.8rem', display: 'block' }}>{f.name}</strong>
                      {catObj && <span style={{ fontSize: '0.62rem', color: catObj.color, fontWeight: 700 }}>{catObj.name}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleOpenEditField(f)}>
                      <i className="fa-solid fa-pen" style={{ fontSize: '0.72rem' }}></i>
                    </button>
                    <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeleteField(f.id)}>
                      <i className="fa-solid fa-trash" style={{ fontSize: '0.72rem' }}></i>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCat && (
        <Modal
          isOpen={!!editingCat}
          onClose={() => setEditingCat(null)}
          title="Ubah Kategori Lomba"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingCat(null)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEditCategory} disabled={!editCatName.trim()}>Simpan</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Nama Kategori</label>
            <input type="text" className="form-input" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div className="form-group">
              <label className="form-label">
                Ikon (FontAwesome) <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noreferrer" style={{ fontSize: '0.68rem', color: 'var(--blue)', textDecoration: 'underline', marginLeft: '4px' }}><i className="fa-solid fa-arrow-up-right-from-square"></i> Panduan Ikon</a>
              </label>
              <input type="text" className="form-input" value={editCatIcon} onChange={(e) => setEditCatIcon(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Hex Color</label>
              <input type="color" className="form-input" value={editCatColor} onChange={(e) => setEditCatColor(e.target.value)} style={{ padding: '4px', height: '40px' }} />
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Field Modal */}
      {editingField && (
        <Modal
          isOpen={!!editingField}
          onClose={() => setEditingField(null)}
          title="Ubah Bidang Lomba"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingField(null)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEditField} disabled={!editFieldName.trim()}>Simpan</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Nama Bidang</label>
            <input type="text" className="form-input" value={editFieldName} onChange={(e) => setEditFieldName(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div className="form-group">
              <label className="form-label">
                Ikon (FontAwesome) <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noreferrer" style={{ fontSize: '0.68rem', color: 'var(--blue)', textDecoration: 'underline', marginLeft: '4px' }}><i className="fa-solid fa-arrow-up-right-from-square"></i> Panduan Ikon</a>
              </label>
              <input type="text" className="form-input" value={editFieldIcon} onChange={(e) => setEditFieldIcon(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Relasi Kategori</label>
              <select className="form-select" value={editFieldCatId} onChange={(e) => setEditFieldCatId(e.target.value)}>
                <option value="">Pilih Kategori...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
