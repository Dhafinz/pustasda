'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

interface Props {
  systemInfo: {
    platform: string
    arch: string
    totalMemory: string
    freeMemory: string
    nodeVersion: string
  }
  tableCounts: Record<string, number>
  initialLogs: Array<{
    id: number
    createdAt: string
    action: string
    description: string | null
    user: { name: string; role: string } | null
  }>
}

const TABLES = [
  { name: 'User', key: 'user', desc: 'Tabel data kredensial akun pengguna' },
  { name: 'StudentProfile', key: 'studentprofile', desc: 'Tabel profil mandiri NIS/Kelas/Jurusan siswa' },
  { name: 'TeacherProfile', key: 'teacherprofile', desc: 'Tabel profil NIP/Keahlian guru pembimbing' },
  { name: 'Category', key: 'category', desc: 'Tabel master data Bidang utama (lomba)' },
  { name: 'Field', key: 'field', desc: 'Tabel master Kategori di bawah Bidang' },
  { name: 'Competition', key: 'competition', desc: 'Tabel data posting detail kompetisi' },
  { name: 'CompetitionStage', key: 'competitionstage', desc: 'Tabel tahapan pengerjaan per lomba' },
  { name: 'SaveFolder', key: 'savefolder', desc: 'Tabel folder bookmark simpanan siswa' },
  { name: 'CompetitionSave', key: 'competitionsave', desc: 'Tabel relasi bookmark lomba & siswa' },
  { name: 'Team', key: 'team', desc: 'Tabel kelompok yang dibuat ketua tim' },
  { name: 'TeamMember', key: 'teammember', desc: 'Tabel relasi anggota tim beserta status invite' },
  { name: 'Participation', key: 'participation', desc: 'Tabel pendaftaran siswa/tim di lomba' },
  { name: 'ParticipationStep', key: 'participationstep', desc: 'Tabel pelacakan checklist 4 tahap siswa' },
  { name: 'Mentorship', key: 'mentorship', desc: 'Tabel pengajuan guru pembimbing kompetisi' },
  { name: 'MentorshipActivity', key: 'mentorshipactivity', desc: 'Tabel agenda bimbingan logbook' },
  { name: 'Notification', key: 'notification', desc: 'Tabel antrean notifikasi pengguna' },
  { name: 'Badge', key: 'badge', desc: 'Tabel medali / gamifikasi prestasi sekolah' },
  { name: 'UserBadge', key: 'userbadge', desc: 'Tabel relasi pencapaian medali siswa' },
  { name: 'AppSetting', key: 'appsetting', desc: 'Tabel key-value konfigurasi sistem' },
  { name: 'ActivityLog', key: 'activitylog', desc: 'Tabel audit log aktivitas sistem' },
  { name: 'Session', key: 'session', desc: 'Tabel database session login' }
]

export function DeveloperDashboardClient({ systemInfo, tableCounts, initialLogs }: Props) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const [activeTab, setActiveTab] = useState<'stats' | 'db' | 'utils'>('stats')
  const [counts, setCounts] = useState(tableCounts)

  // DB Browser States
  const [selectedTable, setSelectedTable] = useState('user')
  const [records, setRecords] = useState<any[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [dbPage, setDbPage] = useState(1)
  const [dbSearch, setDbSearch] = useState('')
  const [dbLoading, setDbLoading] = useState(false)

  // CRUD Actions
  const [actionLoading, setActionLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Utilities Console states
  const [utilLoading, setUtilLoading] = useState(false)

  // Seeder Template States
  const [seederPacks, setSeederPacks] = useState<any[]>([])
  const [loadingPacks, setLoadingPacks] = useState(false)
  const [editingPack, setEditingPack] = useState<any | null>(null)
  const [isPackModalOpen, setIsPackModalOpen] = useState(false)

  // Pack Form Data
  const [packName, setPackName] = useState('')
  const [packDesc, setPackDesc] = useState('')
  const [packSiswaText, setPackSiswaText] = useState('')
  const [packGuruText, setPackGuruText] = useState('')
  const [packBidangText, setPackBidangText] = useState('')

  // Fetch table records
  const fetchTableData = async (tableKey: string, page = 1, searchVal = '') => {
    setDbLoading(true)
    try {
      const res = await fetch('/api/developer/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          table: tableKey,
          page,
          limit: 15,
          search: searchVal
        })
      })
      const data = await res.json()
      if (res.ok) {
        setRecords(data.records || [])
        setTotalRecords(data.total || 0)
        setDbPage(data.page)
      } else {
        addToast(data.error || 'Gagal memuat baris data', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setDbLoading(false)
    }
  }

  // Load selected table on click
  useEffect(() => {
    if (activeTab === 'db') {
      fetchTableData(selectedTable, 1, dbSearch)
    }
  }, [selectedTable, activeTab])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTableData(selectedTable, 1, dbSearch)
  }

  const handlePageChange = (newPage: number) => {
    fetchTableData(selectedTable, newPage, dbSearch)
  }

  // Trigger seeding / wipe / normalize
  const runUtility = async (type: 'seed' | 'wipe' | 'normalize') => {
    let confirmMsg = ''
    if (type === 'seed') confirmMsg = 'Apakah Anda yakin ingin menjalankan DB Seeder? Data lama (kecuali akun admin/dev) akan dibersihkan terlebih dahulu.'
    if (type === 'wipe') confirmMsg = 'PERINGATAN KRITIS: Anda akan menghapus seluruh data siswa, guru, lomba, tim, bimbingan, dsb. Hanya akun developer Anda yang dipertahankan. Lanjutkan?'
    if (type === 'normalize') confirmMsg = 'Jalankan data-fixer untuk membersihkan Kelas & Jurusan siswa yang salah format di database?'

    if (!confirm(confirmMsg)) return

    setUtilLoading(true)
    addToast('Menjalankan utilitas database...', 'info')
    try {
      const res = await fetch('/api/developer/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: type })
      })
      const data = await res.json()
      if (res.ok) {
        addToast(data.message, 'success')

        // Sync counts
        const countRes = await fetch('/api/developer/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read', table: 'user', limit: 1 })
        })
        router.refresh()
        window.location.reload()
      } else {
        addToast(data.error || 'Utilitas gagal dijalankan', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUtilLoading(false)
    }
  }

  // Seeder Template Pack Functions
  const fetchSeederPacks = async () => {
    setLoadingPacks(true)
    try {
      const res = await fetch('/api/developer/seeder')
      if (res.ok) {
        const data = await res.json()
        setSeederPacks(data.templates || [])
      }
    } catch {
      addToast('Gagal memuat template seeder', 'error')
    } finally {
      setLoadingPacks(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'utils') {
      fetchSeederPacks()
    }
  }, [activeTab])

  const handleOpenPackCreate = () => {
    setEditingPack(null)
    setPackName('')
    setPackDesc('')
    setPackSiswaText('Siswa Satu, Siswa Dua, Siswa Tiga')
    setPackGuruText(JSON.stringify([
      { name: "Nama Guru Baru", jabatan: "Guru Produktif", bidang: "Teknologi Informasi" }
    ], null, 2))
    setPackBidangText(JSON.stringify([
      { name: "Teknologi Informasi", icon: "fa-microchip", color: "#2196F3", fields: ["Pemrograman Web", "Pemrograman Mobile"] }
    ], null, 2))
    setIsPackModalOpen(true)
  }

  const handleOpenPackEdit = (pack: any) => {
    setEditingPack(pack)
    setPackName(pack.name)
    setPackDesc(pack.description)
    setPackSiswaText(pack.siswa.join(', '))
    setPackGuruText(JSON.stringify(pack.guru, null, 2))
    setPackBidangText(JSON.stringify(pack.bidang, null, 2))
    setIsPackModalOpen(true)
  }

  const handleSavePack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!packName.trim()) {
      addToast('Nama template harus diisi', 'error')
      return
    }

    let parsedSiswa: string[] = []
    let parsedGuru: any[] = []
    let parsedBidang: any[] = []

    try {
      parsedSiswa = packSiswaText.split(',').map(s => s.trim()).filter(Boolean)
    } catch {
      addToast('Format daftar siswa tidak valid', 'error')
      return
    }

    try {
      parsedGuru = JSON.parse(packGuruText)
      if (!Array.isArray(parsedGuru)) throw new Error()
    } catch {
      addToast('Format JSON guru tidak valid. Harus berupa array.', 'error')
      return
    }

    try {
      parsedBidang = JSON.parse(packBidangText)
      if (!Array.isArray(parsedBidang)) throw new Error()
    } catch {
      addToast('Format JSON bidang tidak valid. Harus berupa array.', 'error')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/developer/seeder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingPack ? 'update' : 'create',
          id: editingPack?.id,
          name: packName,
          description: packDesc,
          siswa: parsedSiswa,
          guru: parsedGuru,
          bidang: parsedBidang
        })
      })
      const data = await res.json()
      if (res.ok) {
        addToast(data.message, 'success')
        setIsPackModalOpen(false)
        fetchSeederPacks()
      } else {
        addToast(data.error || 'Gagal menyimpan template', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePack = async (packId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template pack ini?')) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/developer/seeder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: packId })
      })
      const data = await res.json()
      if (res.ok) {
        addToast(data.message, 'success')
        fetchSeederPacks()
      } else {
        addToast(data.error || 'Gagal menghapus template', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRunPackSeed = async (packId: string) => {
    if (!confirm('Apakah Anda yakin ingin melakukan seeding database menggunakan template pack ini? Seluruh data pendaftaran lama akan dihapus.')) return
    setUtilLoading(true)
    addToast('Menjalankan seeding template database...', 'info')
    try {
      const res = await fetch('/api/developer/seeder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_seed', id: packId })
      })
      const data = await res.json()
      if (res.ok) {
        addToast(data.message, 'success')
        router.refresh()
        window.location.reload()
      } else {
        addToast(data.error || 'Seeding gagal', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setUtilLoading(false)
    }
  }

  // Handle row deletion
  const handleDeleteRow = async (id: any) => {
    if (!confirm(`Hapus baris data ID ${id} dari tabel ${selectedTable}? Tindakan ini bersifat permanen!`)) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/developer/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          table: selectedTable,
          recordId: id
        })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Data berhasil dihapus!', 'success')
        fetchTableData(selectedTable, dbPage, dbSearch)
      } else {
        addToast(data.error || 'Gagal menghapus data', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Open Create Modal
  const openCreateModal = () => {
    const defaultForm: Record<string, any> = {}
    if (records.length > 0) {
      Object.keys(records[0]).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          if (key === 'role') {
            defaultForm[key] = 'student'
          } else if (key === 'isActive') {
            defaultForm[key] = 'true'
          } else {
            defaultForm[key] = ''
          }
        }
      })
    } else {
      defaultForm['name'] = ''
    }
    setFormData(defaultForm)
    setIsCreateModalOpen(true)
  }

  // Handle Save Create
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch('/api/developer/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          table: selectedTable,
          data: formData
        })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Baris data baru berhasil ditambahkan!', 'success')
        setIsCreateModalOpen(false)
        fetchTableData(selectedTable, 1, dbSearch)
      } else {
        addToast(data.error || 'Gagal membuat data baru', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (row: any) => {
    const editForm = { ...row }
    delete editForm.id
    delete editForm.createdAt
    delete editForm.updatedAt
    setFormData(editForm)
    setEditingRecord(row)
  }

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/developer/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          table: selectedTable,
          recordId: editingRecord.id,
          data: formData
        })
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Detail data berhasil diperbarui!', 'success')
        setEditingRecord(null)
        fetchTableData(selectedTable, dbPage, dbSearch)
      } else {
        addToast(data.error || 'Gagal menyimpan pembaruan', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const tableKeys = records.length > 0 ? Object.keys(records[0]) : []
  const totalPages = Math.ceil(totalRecords / 15)

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>
            <i className="fa-solid fa-server text-red"></i> Konsol Web Developer
          </h1>
          <p>Kontrol penuh database Prisma ORM pustasda, seeding data, normalisasi data, reset sistem, dsb.</p>
        </div>

        {/* Tab Controls */}
        <div className="tab-menu" style={{ background: 'var(--gray-light)', padding: '4px', borderRadius: 'var(--radius)', display: 'flex', gap: '4px' }}>
          <button className={`tab-btn btn-sm ${activeTab === 'stats' ? 'active bg-white text-dark shadow-sm' : 'text-gray'}`} style={{ border: 'none', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('stats')}>
            <i className="fa-solid fa-chart-line"></i> System &amp; Audit Logs
          </button>
          <button className={`tab-btn btn-sm ${activeTab === 'db' ? 'active bg-white text-dark shadow-sm' : 'text-gray'}`} style={{ border: 'none', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('db')}>
            <i className="fa-solid fa-database"></i> Database Browser (phpMyAdmin)
          </button>
          <button className={`tab-btn btn-sm ${activeTab === 'utils' ? 'active bg-white text-dark shadow-sm' : 'text-gray'}`} style={{ border: 'none', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('utils')}>
            <i className="fa-solid fa-screwdriver-wrench"></i> Utilitas Database
          </button>
        </div>
      </div>

      {/* TAB 1: SYSTEM INFO & AUDIT LOGS */}
      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cleanup Reminder Alert */}
          <div style={{ background: 'var(--blue-light)', borderLeft: '4px solid var(--blue)', padding: '12px 18px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--dark-mid)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-circle-info text-blue" style={{ fontSize: '1.1rem' }}></i>
            <div>
              <strong>Pembersihan Log Otomatis Aktif:</strong> Semua record log aktivitas sistem (Activity Logs) yang berusia di atas 30 hari dibersihkan secara otomatis oleh server setiap kali Anda memuat dasbor developer ini demi menjaga optimasi penyimpanan database.
            </div>
          </div>

          {/* OS Environment */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 className="card-title" style={{ marginBottom: '14px' }}>
              <i className="fa-solid fa-microchip text-blue" style={{ marginRight: '6px' }}></i> Informasi Lingkungan Server
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              <div style={{ background: 'var(--gray-light)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>SYSTEM PLATFORM</span>
                <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px', textTransform: 'capitalize' }}>{systemInfo.platform} ({systemInfo.arch})</strong>
              </div>
              <div style={{ background: 'var(--gray-light)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>NODE RUNTIME</span>
                <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>{systemInfo.nodeVersion}</strong>
              </div>
              <div style={{ background: 'var(--gray-light)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>TOTAL RAM</span>
                <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>{systemInfo.totalMemory}</strong>
              </div>
              <div style={{ background: 'var(--gray-light)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>FREE RAM</span>
                <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>{systemInfo.freeMemory}</strong>
              </div>
              <div style={{ background: 'var(--gray-light)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 600 }}>DB DRIVER</span>
                <strong style={{ display: 'block', fontSize: '0.82rem', marginTop: '2px' }}>Prisma SQLite</strong>
              </div>
            </div>

            {/* Source resource explanation and tools */}
            <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--blue-light)', borderLeft: '3px solid var(--blue)', borderRadius: '4px', fontSize: '0.72rem', lineHeight: 1.4, color: 'var(--dark-mid)' }}>
              <i className="fa-solid fa-server" style={{ marginRight: '6px' }}></i>
              <strong>Informasi Sumber Daya:</strong> Data memori RAM di atas dibaca secara realtime dari sistem operasi menggunakan modul Node.js <code>os</code> (yaitu <code>os.totalmem()</code> &amp; <code>os.freemem()</code>). Database utama menggunakan <strong>SQLite (file: <code>prisma/dev.db</code>)</strong>. Untuk memanipulasi, melihat, mengedit, dan mengunduh data secara penuh dari visual editor, Anda dapat menjalankan perintah terminal: <code>npx prisma studio</code> untuk mengakses portal database visual di <a href="http://localhost:5555" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline', fontWeight: 600 }}>http://localhost:5555</a>.
            </div>
          </div>

          {/* Audit Logs */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-light)' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800 }}>Audit Logs Keamanan Aktivitas Pengguna (10 Terbaru)</h3>
            </div>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi Modul</th>
                  <th>Deskripsi Log</th>
                </tr>
              </thead>
              <tbody>
                {initialLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.8rem', display: 'block' }}>{log.user?.name || 'System Guest'}</strong>
                        <span style={{ fontSize: '0.65rem', color: 'var(--gray)', textTransform: 'capitalize' }}>Role: {log.user?.role || 'Guest'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill badge-gray" style={{ textTransform: 'uppercase', fontSize: '0.62rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--gray-dark)' }}>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: phpMyAdmin DATABASE BROWSER */}
      {activeTab === 'db' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Table Sidebar */}
          <div className="card" style={{ padding: '14px', maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', paddingLeft: '6px' }}>Tabel Pustasda ({TABLES.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {TABLES.map(t => {
                const isActive = selectedTable === t.key
                const count = counts[t.key] || 0
                return (
                  <button
                    key={t.key}
                    onClick={() => { setSelectedTable(t.key); setDbPage(1); setDbSearch(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isActive ? 'var(--red-light)' : 'transparent',
                      color: isActive ? 'var(--red)' : 'var(--dark-mid)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.78rem',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-table" style={{ fontSize: '0.7rem', opacity: isActive ? 1 : 0.5 }}></i>
                      {t.name}
                    </span>
                    <span style={{ background: isActive ? 'var(--red)' : 'var(--gray-mid)', color: isActive ? 'white' : 'var(--gray-dark)', fontSize: '0.62rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Table View */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Control Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'capitalize' }}>Tabel: {selectedTable}</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '2px' }}>{TABLES.find(t => t.key === selectedTable)?.desc}</p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="search-bar" style={{ width: '220px', margin: 0, height: '36px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ top: '10px' }}></i>
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    style={{ padding: '6px 12px 6px 32px', fontSize: '0.75rem', height: '100%' }}
                  />
                </form>

                {/* Add Data Row Button */}
                <button className="btn btn-primary btn-sm" style={{ height: '36px', padding: '0 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={openCreateModal}>
                  <i className="fa-solid fa-plus"></i> Tambah Data
                </button>
              </div>
            </div>

            {/* Grid Records Table */}
            {dbLoading ? (
              <div className="loading-center" style={{ padding: '60px' }}>
                <div className="spinner"></div>
              </div>
            ) : records.length > 0 ? (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="leaderboard-table" style={{ whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '80px', width: '80px' }}>Aksi</th>
                      {tableKeys.map(k => (
                        <th key={k}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: '0.65rem' }} onClick={() => openEditModal(row)} disabled={actionLoading}>
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button className="btn btn-outline btn-sm" style={{ padding: '2px 6px', fontSize: '0.65rem', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeleteRow(row.id)} disabled={actionLoading}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                        {tableKeys.map(k => {
                          const val = row[k]
                          let displayVal = ''
                          if (val === null) displayVal = 'NULL'
                          else if (val === undefined) displayVal = 'UNDEFINED'
                          else if (typeof val === 'object') displayVal = JSON.stringify(val)
                          else if (typeof val === 'boolean') displayVal = val ? 'TRUE' : 'FALSE'
                          else displayVal = String(val)

                          return (
                            <td key={k} style={{ fontSize: '0.72rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {displayVal}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '60px 20px' }}>
                <i className="fa-solid fa-table-list" style={{ fontSize: '3rem', opacity: 0.2 }}></i>
                <h3>Tabel Kosong</h3>
                <p>Tidak ada baris data tersimpan di tabel ini atau kueri pencarian tidak cocok.</p>
              </div>
            )}

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>Menampilkan Halaman {dbPage} dari {totalPages} &bull; Total {totalRecords} baris data</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.68rem' }} onClick={() => handlePageChange(dbPage - 1)} disabled={dbPage === 1 || dbLoading}>Sebelumnya</button>
                  <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: '0.68rem' }} onClick={() => handlePageChange(dbPage + 1)} disabled={dbPage === totalPages || dbLoading}>Selanjutnya</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONSOLE UTILITIES & RESETS */}
      {activeTab === 'utils' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Utilities: Normalizer & Wipe */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {/* Normalizer utility */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '14px' }}>
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '6px' }}>Normalisasi Kelas &amp; Jurusan</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.4 }}>
                  Memperbaiki format data siswa yang menyimpang di database. Mengubah string kelas panjang seperti "XII SIJA TJAT" menjadi "XII", dan menyelaraskan jurusan ke "SIJA" atau "TJAT" agar form edit profil tidak rusak/blank.
                </p>
              </div>
              <button className="btn btn-primary btn-block btn-sm" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => runUtility('normalize')} disabled={utilLoading}>
                {utilLoading ? 'Menyembuhkan Data...' : 'Bersihkan & Normalisasi'}
              </button>
            </div>

            {/* Wipe utility */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderColor: 'rgba(227, 30, 37, 0.2)', boxShadow: '0 4px 12px rgba(227, 30, 37, 0.05)' }}>
              <div style={{ flex: 1, marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '14px' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '6px', color: 'var(--red)' }}>Reset Total Database (Wipe)</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.4 }}>
                  <strong>TINDAKAN BERBAHAYA:</strong> Menghapus total seluruh records di semua tabel database, termasuk postingan kompetisi, tim pendaftaran, bimbingan guru, dan akun siswa/guru. Hanya akun developer Anda yang tidak terhapus.
                </p>
              </div>
              <button className="btn btn-primary btn-block btn-sm" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => runUtility('wipe')} disabled={utilLoading}>
                {utilLoading ? 'Sedang Wiping...' : 'Reset Database Total'}
              </button>
            </div>
          </div>

          {/* Seeder Template Packs Management */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-seedling text-blue"></i>
                  Database Seeder Template Packs
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '2px' }}>
                  Kelola, tambah, edit, dan jalankan template data demo untuk melakukan seeding instan ke database.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleOpenPackCreate} disabled={loadingPacks || utilLoading}>
                <i className="fa-solid fa-plus"></i> Tambah Template Pack
              </button>
            </div>

            {loadingPacks ? (
              <div className="loading-center" style={{ padding: '40px 0' }}>
                <div className="spinner"></div>
              </div>
            ) : seederPacks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {seederPacks.map(pack => (
                  <div key={pack.id} style={{ border: '1px solid var(--gray-mid)', padding: '16px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--white)' }}>
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--dark)' }}>{pack.name}</strong>
                        {pack.id === 'default' && <span className="badge-pill badge-blue" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>System Default</span>}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '4px', lineHeight: 1.4 }}>{pack.description}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.68rem', color: 'var(--gray-dark)', fontWeight: 500 }}>
                        <span><i className="fa-solid fa-user-graduate"></i> {pack.siswa?.length || 0} Siswa</span>
                        <span><i className="fa-solid fa-chalkboard-user"></i> {pack.guru?.length || 0} Guru</span>
                        <span><i className="fa-solid fa-folder-open"></i> {pack.bidang?.length || 0} Bidang</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => handleOpenPackEdit(pack)} disabled={utilLoading}>
                        <i className="fa-solid fa-pen"></i> Edit
                      </button>
                      {pack.id !== 'default' && (
                        <button className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.7rem', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeletePack(pack.id)} disabled={actionLoading || utilLoading}>
                          <i className="fa-solid fa-trash-can"></i> Hapus
                        </button>
                      )}
                      <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => handleRunPackSeed(pack.id)} disabled={utilLoading}>
                        <i className="fa-solid fa-play"></i> Seed Database
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>Tidak ada template pack tersedia.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW ROW RECORD */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={`Tambah Data Baru: ${selectedTable}`}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCreateModalOpen(false)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveCreate} disabled={actionLoading}>
                {actionLoading ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '8px' }}>
            {Object.keys(formData).map(key => {
              const excludedFields = ['rememberToken', 'emailVerifiedAt', 'emailVerified', 'passwordResetToken', 'photo', 'waNumber']
              if (excludedFields.includes(key)) return null

              const val = formData[key]

              // Custom isActive dropdown
              if (key === 'isActive') {
                return (
                  <div className="form-group" key={key}>
                    <label className="form-label">Status Akun (Is Active)</label>
                    <select
                      className="form-select"
                      value={String(val)}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    >
                      <option value="true">True (Aktif)</option>
                      <option value="false">False (Nonaktif)</option>
                    </select>
                  </div>
                )
              }

              // Custom role dropdown
              if (key === 'role') {
                return (
                  <div className="form-group" key={key}>
                    <label className="form-label">Role Akses (Role)</label>
                    <select
                      className="form-select"
                      value={val || 'student'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="student">Student (Siswa)</option>
                      <option value="teacher">Teacher (Guru)</option>
                      <option value="admin">Admin</option>
                      <option value="developer">Developer</option>
                    </select>
                  </div>
                )
              }

              return (
                <div className="form-group" key={key}>
                  <label className="form-label" style={{ textTransform: 'capitalize' }}>{key}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={val}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={`Masukkan nilai untuk ${key}`}
                  />
                </div>
              )
            })}
          </form>
        </Modal>
      )}

      {/* MODAL: EDIT ROW RECORD */}
      {editingRecord && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title={`Edit Data: ${selectedTable} (ID: ${editingRecord.id})`}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingRecord(null)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={actionLoading}>
                {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '8px' }}>
            {Object.keys(formData).map(key => {
              const val = formData[key]
              let displayVal = ''
              if (val !== null && val !== undefined) {
                if (typeof val === 'object') displayVal = JSON.stringify(val)
                else displayVal = String(val)
              }
              return (
                <div className="form-group" key={key}>
                  <label className="form-label" style={{ textTransform: 'capitalize' }}>{key}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={displayVal}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  />
                </div>
              )
            })}
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE/EDIT SEEDER TEMPLATE PACK */}
      {isPackModalOpen && (
        <Modal
          isOpen={isPackModalOpen}
          onClose={() => setIsPackModalOpen(false)}
          title={editingPack ? `Edit Template Pack: ${editingPack.name}` : 'Tambah Seeder Template Pack'}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsPackModalOpen(false)}>Batal</button>
              <button className="btn btn-primary btn-sm" onClick={handleSavePack} disabled={actionLoading}>
                {actionLoading ? 'Menyimpan...' : 'Simpan Template'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSavePack} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', paddingRight: '8px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Nama Template Pack</label>
              <input
                type="text"
                className="form-input"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Masukkan nama template, misal: Uji Coba LKS"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Deskripsi</label>
              <input
                type="text"
                className="form-input"
                value={packDesc}
                onChange={(e) => setPackDesc(e.target.value)}
                placeholder="Masukkan penjelasan singkat template pack"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Daftar Nama Siswa (Pisahkan dengan koma)</label>
              <textarea
                className="form-input"
                rows={4}
                value={packSiswaText}
                onChange={(e) => setPackSiswaText(e.target.value)}
                placeholder="Nama Siswa A, Nama Siswa B, Nama Siswa C"
                style={{ fontFamily: 'sans-serif', fontSize: '0.78rem', resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', marginTop: '4px', display: 'block' }}>
                Akun siswa fiktif akan dibuat otomatis menggunakan password default: <code>password</code>. Format kelas/jurusan akan diset acak secara valid (X/XI/XII/XIII, SIJA/TJAT).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>JSON Data Guru</label>
              <textarea
                className="form-input"
                rows={5}
                value={packGuruText}
                onChange={(e) => setPackGuruText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.72rem', resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', marginTop: '4px', display: 'block' }}>
                Array JSON yang memuat objek guru: <code>{"{"} name: string, jabatan: string, bidang: string {"}"}</code>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>JSON Data Bidang &amp; Kategori Lomba</label>
              <textarea
                className="form-input"
                rows={5}
                value={packBidangText}
                onChange={(e) => setPackBidangText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.72rem', resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--gray)', marginTop: '4px', display: 'block' }}>
                Array JSON memuat bidang: <code>{"{"} name: string, icon: string, color: string, fields: string[] {"}"}</code>
              </span>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
