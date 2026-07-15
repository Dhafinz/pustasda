'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

interface UserItem {
  id: number
  name: string
  email: string
  role: string
  photo: string | null
  waNumber: string | null
  isActive: boolean
  createdAt: string
  profileDetail: {
    nis?: string | null
    kelas?: string | null
    jurusan?: string | null
    nip?: string | null
    bidangKeahlian?: string | null
    jabatan?: string | null
    angkatan?: string | null
  } | null
}

export function AdminUsersClient({ initialUsers }: { initialUsers: UserItem[] }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // Modal: Add Single User
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [extra1, setExtra1] = useState('') // NIS or NIP
  const [extra2, setExtra2] = useState('XII') // Kelas or Bidang Keahlian
  const [extra3, setExtra3] = useState('SIJA') // Jurusan or Jabatan
  const [angkatan, setAngkatan] = useState('2026') // student angkatan
  const [showPasswordAdd, setShowPasswordAdd] = useState(false)
  const [showPasswordEdit, setShowPasswordEdit] = useState(false)

  // Modal: Edit User
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState('student')
  const [editActive, setEditActive] = useState(true)
  const [editExtra1, setEditExtra1] = useState('')
  const [editExtra2, setEditExtra2] = useState('')
  const [editExtra3, setEditExtra3] = useState('')
  const [editAngkatan, setEditAngkatan] = useState('')

  // Modal: Bulk Users Upload
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const handleFetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?role=${roleFilter}&q=${searchQuery}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch {
      addToast('Gagal memuat ulang data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Submit Single User
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: [{
            name,
            email,
            password,
            role,
            extra1,
            extra2,
            extra3,
            angkatan: role === 'student' ? angkatan : undefined
          }]
        })
      })

      const data = await res.json()
      if (res.ok && data.createdCount > 0) {
        addToast('Akun pengguna berhasil dibuat!', 'success')
        setIsSingleModalOpen(false)
        setName('')
        setEmail('')
        setPassword('')
        setExtra1('')
        setExtra2('XII')
        setExtra3('SIJA')
        setAngkatan('2026')
        setShowPasswordAdd(false)
        handleFetchUsers()
        router.refresh()
      } else {
        addToast(data.error || 'Email sudah digunakan siswa/guru lain.', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Edit User Handler
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditPassword('')
    setEditRole(user.role)
    setEditActive(user.isActive)
    setEditExtra1(user.profileDetail?.nis || user.profileDetail?.nip || '')
    setEditExtra2(user.profileDetail?.kelas || user.profileDetail?.bidangKeahlian || 'XII')
    setEditExtra3(user.profileDetail?.jurusan || user.profileDetail?.jabatan || 'SIJA')
    setEditAngkatan(user.profileDetail?.angkatan || '2026')
    setShowPasswordEdit(false)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          password: editPassword,
          role: editRole,
          isActive: editActive,
          extra1: editExtra1,
          extra2: editExtra2,
          extra3: editExtra3,
          angkatan: editRole === 'student' ? editAngkatan : undefined
        })
      })

      const data = await res.json()
      if (res.ok) {
        addToast('Akun pengguna berhasil diperbarui!', 'success')
        setEditingUser(null)
        handleFetchUsers()
        router.refresh()
      } else {
        addToast(data.error || 'Gagal menyimpan perubahan.', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun ini? Riwayat lomba & bimbingan yang bersangkutan akan terhapus.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        addToast('Akun berhasil dihapus.', 'success')
        setUsers(users.filter(u => u.id !== id))
        router.refresh()
      } else {
        const data = await res.json()
        addToast(data.error || 'Gagal menghapus user', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Submit Bulk Upload
  const handleAddBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkText.trim()) return

    setLoading(true)
    try {
      const lines = bulkText.split('\n').filter(l => l.trim() !== '')
      const parsedUsers = lines.map((line) => {
        const parts = line.split(';')
        return {
          name: parts[0]?.trim(),
          email: parts[1]?.trim(),
          password: parts[2]?.trim() || 'password123',
          role: parts[3]?.trim()?.toLowerCase() || 'student',
          extra1: parts[4]?.trim() || '',
          extra2: parts[5]?.trim() || 'XII SIJA TJAT',
          extra3: parts[6]?.trim() || 'RPL',
          angkatan: parts[7]?.trim() || '2026'
        }
      })

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedUsers })
      })

      const data = await res.json()
      if (res.ok) {
        addToast(`Selesai memproses bulk akun. Berhasil: ${data.createdCount}, Lewati Duplikat: ${data.skippedCount}`, 'success')
        setIsBulkModalOpen(false)
        setBulkText('')
        handleFetchUsers()
        router.refresh()
      } else {
        addToast(data.error || 'Gagal memproses bulk upload', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = !roleFilter || u.role === roleFilter
    const matchesSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>
            <i className="fa-solid fa-users-gear text-red"></i> Manajemen Pengguna
          </h1>
          <p>Kelola data akun siswa dan guru pembimbing, serta buat burst pembuatan akun baru.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setIsSingleModalOpen(true)}>
            <i className="fa-solid fa-user-plus"></i> Tambah Akun
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsBulkModalOpen(true)}>
            <i className="fa-solid fa-users-viewfinder"></i> Bulk Import
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Cari pengguna berdasarkan nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: '180px' }}>
            <option value="">Semua Peran (Role)</option>
            <option value="student">Siswa (Student)</option>
            <option value="teacher">Guru (Teacher)</option>
            <option value="admin">Administrator</option>
            <option value="developer">Developer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredUsers.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Nama &amp; Email</th>
                <th>Peran</th>
                <th>NIS / NIP</th>
                <th>Kelas / Keahlian</th>
                <th>Jurusan / Angkatan</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div>
                      <strong style={{ fontSize: '0.82rem', display: 'block' }}>{u.name}</strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-pill ${u.role === 'student' ? 'badge-blue' : u.role === 'teacher' ? 'badge-yellow' : 'badge-red'}`} style={{ textTransform: 'capitalize', fontSize: '0.68rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.profileDetail?.nis || u.profileDetail?.nip || '-'}</td>
                  <td>{u.profileDetail?.kelas || u.profileDetail?.bidangKeahlian || '-'}</td>
                  <td>
                    {u.role === 'student' 
                      ? `${u.profileDetail?.jurusan || '-'} (Angk. ${u.profileDetail?.angkatan || '-'})` 
                      : u.profileDetail?.jabatan || '-'}
                  </td>
                  <td>
                    <span className={`badge-pill ${u.isActive ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.68rem' }}>
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleOpenEdit(u)}>
                        <i className="fa-solid fa-pen" style={{ fontSize: '0.72rem' }}></i>
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeleteUser(u.id)}>
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
            <i className="fa-solid fa-user-slash" style={{ fontSize: '3rem' }}></i>
            <h3>Tidak ada pengguna ditemukan</h3>
          </div>
        )}
      </div>

      {/* Modal: Add Single User */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title="Buat Akun Pengguna Baru"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsSingleModalOpen(false)}>Batal</button>
            <button className="btn btn-primary btn-sm" onClick={handleAddSingle} disabled={loading || !name || !email}>
              Simpan Akun
            </button>
          </>
        }
      >
        <form onSubmit={handleAddSingle}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Kata Sandi (Password)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswordAdd ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: password123 jika dikosongkan"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPasswordAdd(!showPasswordAdd)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <i className={`fa-solid ${showPasswordAdd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hak Akses (Role)</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Siswa (Student)</option>
              <option value="teacher">Guru Pembimbing (Teacher)</option>
              <option value="admin">Administrator</option>
              <option value="developer">Web Developer</option>
            </select>
          </div>

          {role === 'student' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label">NIS</label>
                  <input type="text" className="form-input" value={extra1} onChange={(e) => setExtra1(e.target.value)} placeholder="2026xxxx" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Angkatan</label>
                  <input type="text" className="form-input" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} placeholder="2026" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Kelas</label>
                  <select className="form-select" value={extra2} onChange={(e) => setExtra2(e.target.value)}>
                    <option value="X">X</option>
                    <option value="XI">XI</option>
                    <option value="XII">XII</option>
                    <option value="XIII">XIII</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jurusan</label>
                  <select className="form-select" value={extra3} onChange={(e) => setExtra3(e.target.value)}>
                    <option value="SIJA">SIJA</option>
                    <option value="TJAT">TJAT</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {role === 'teacher' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">NIP</label>
                <input type="text" className="form-input" value={extra1} onChange={(e) => setExtra1(e.target.value)} placeholder="1985xxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Keahlian</label>
                <input type="text" className="form-input" value={extra2} onChange={(e) => setExtra2(e.target.value)} placeholder="Keahlian" />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan</label>
                <input type="text" className="form-input" value={extra3} onChange={(e) => setExtra3(e.target.value)} placeholder="Guru" />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal: Edit User */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title="Ubah Akun Pengguna"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={loading || !editName || !editEmail}>
                Simpan Perubahan
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input type="email" className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Kata Sandi (Isi untuk mengganti)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswordEdit ? 'text' : 'password'}
                className="form-input"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Biarkan kosong jika tidak diubah"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPasswordEdit(!showPasswordEdit)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <i className={`fa-solid ${showPasswordEdit ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div className="form-group">
              <label className="form-label">Hak Akses (Role)</label>
              <select className="form-select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                <option value="student">Siswa (Student)</option>
                <option value="teacher">Guru Pembimbing (Teacher)</option>
                <option value="admin">Administrator</option>
                <option value="developer">Web Developer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status Akun</label>
              <select className="form-select" value={editActive ? 'true' : 'false'} onChange={(e) => setEditActive(e.target.value === 'true')}>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>

          {editRole === 'student' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label">NIS</label>
                  <input type="text" className="form-input" value={editExtra1} onChange={(e) => setEditExtra1(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tahun Angkatan</label>
                  <input type="text" className="form-input" value={editAngkatan} onChange={(e) => setEditAngkatan(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Kelas</label>
                  <select className="form-select" value={editExtra2} onChange={(e) => setEditExtra2(e.target.value)}>
                    <option value="X">X</option>
                    <option value="XI">XI</option>
                    <option value="XII">XII</option>
                    <option value="XIII">XIII</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jurusan</label>
                  <select className="form-select" value={editExtra3} onChange={(e) => setEditExtra3(e.target.value)}>
                    <option value="SIJA">SIJA</option>
                    <option value="TJAT">TJAT</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {editRole === 'teacher' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">NIP</label>
                <input type="text" className="form-input" value={editExtra1} onChange={(e) => setEditExtra1(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Keahlian</label>
                <input type="text" className="form-input" value={editExtra2} onChange={(e) => setEditExtra2(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan</label>
                <input type="text" className="form-input" value={editExtra3} onChange={(e) => setEditExtra3(e.target.value)} />
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal: Bulk Users Upload */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Import Akun Siswa &amp; Guru"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsBulkModalOpen(false)}>Batal</button>
            <button className="btn btn-primary btn-sm" onClick={handleAddBulk} disabled={loading || !bulkText.trim()}>
              Proses Impor Akun
            </button>
          </>
        }
      >
        <form onSubmit={handleAddBulk}>
          <div className="form-group">
            <label className="form-label">Format Penulisan Data (Gunakan Pemisah Semikolon ';')</label>
            <textarea
              className="form-input"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Contoh format per baris:&#10;Nama Siswa;email@siswa.com;pass123;student;NIS12345;XII SIJA TJAT;RPL;2026&#10;Nama Guru;email@guru.com;pass456;teacher;NIP56789;Informatika;Guru"
              style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.4 }}
              required
            />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--gray)', lineHeight: 1.4 }}>
            Pastikan setiap baris data dipisahkan dengan tanda semikolon (;) sesuai format: <strong>Nama;Email;Password;Role;NIS/NIP;Kelas/Bidang;Jurusan/Jabatan;Angkatan</strong>. Email duplikat akan diabaikan secara aman.
          </p>
        </form>
      </Modal>
    </div>
  )
}
