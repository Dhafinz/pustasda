'use client'

import { useState, useEffect } from 'react'

interface StudentData {
  id: number
  name: string
  email: string
  photo: string | null
  nis: string
  kelas: string
  jurusan: string
  bioAi: string | null
  stats: {
    active: number
    completed: number
    juara: number
  }
  competitions: Array<{
    id: number
    title: string
    categoryName: string
    categoryColor: string
    status: string
  }>
}

export function TeacherSearchStudentClient({ initialStudents }: { initialStudents: StudentData[] }) {
  const [students, setStudents] = useState<StudentData[]>(initialStudents)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    initialStudents.length > 0 ? initialStudents[0] : null
  )

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/teacher/students?q=${searchQuery}`)
        if (res.ok) {
          const data = await res.json()
          setStudents(data.students)
          if (data.students.length > 0) {
            setSelectedStudent(data.students[0])
          } else {
            setSelectedStudent(null)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const delayDebounce = setTimeout(() => {
      fetchStudents()
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registered': return 'Terdaftar'
      case 'in_progress': return 'Pengerjaan'
      case 'submitted': return 'Submitted'
      default: return status
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>
          <i className="fa-solid fa-magnifying-glass text-red"></i> Cari Profil &amp; Aktivitas Siswa
        </h1>
        <p>Pantau keterlibatan siswa-siswi dalam kompetisi, rekam jejak juara, serta minat karakter mereka.</p>
      </div>

      {/* Search Input Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="search-bar">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Cari siswa berdasarkan nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List / Detail Split Layout */}
      <div className="explore-layout">
        {/* Left Column: Student List */}
        <div>
          {loading ? (
            <div className="loading-center"><div className="spinner"></div></div>
          ) : students.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`card ${selectedStudent?.id === student.id ? 'active' : ''}`}
                  onClick={() => setSelectedStudent(student)}
                  style={{
                    cursor: 'pointer',
                    border: selectedStudent?.id === student.id ? '1.5px solid var(--red)' : '1px solid rgba(0,0,0,0.04)',
                    boxShadow: selectedStudent?.id === student.id ? 'var(--shadow-red)' : 'var(--shadow)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--red)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', overflow: 'hidden', flexShrink: 0 }}>
                    {student.photo && student.photo !== 'default-avatar.png' && student.photo !== 'default_avatar.png' ? (
                      <img src={student.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      student.name.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || 'U'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--dark)' }}>{student.name}</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>NIS: {student.nis} &bull; Kelas {student.kelas}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <i className="fa-solid fa-user-slash"></i>
                <h3>Siswa tidak ditemukan</h3>
                <p>Coba kata kunci pencarian nama atau NIS lainnya.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Student Profile Details */}
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h3 className="section-title">
              <i className="fa-regular fa-user text-red"></i> Detail Profil Siswa
            </h3>
          </div>

          <div className="detail-panel-body">
            {selectedStudent ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--red)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', overflow: 'hidden', flexShrink: 0 }}>
                    {selectedStudent.photo && selectedStudent.photo !== 'default-avatar.png' && selectedStudent.photo !== 'default_avatar.png' ? (
                      <img src={selectedStudent.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      selectedStudent.name.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || 'U'
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedStudent.name}</h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>
                      NIS: {selectedStudent.nis} &bull; {selectedStudent.jurusan}
                    </p>
                  </div>
                </div>

                {/* AI Bio Summary Section */}
                <div style={{ background: 'var(--red-light)', borderLeft: '3.5px solid var(--red)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                  <strong style={{ fontSize: '0.72rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    <i className="fa-solid fa-brain"></i> AI Karakter &amp; Minat
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gray-dark)', lineHeight: 1.5 }}>
                    {selectedStudent.bioAi}
                  </p>
                </div>

                {/* Performance Stats Panel */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.2rem', display: 'block', color: 'var(--blue)' }}>{selectedStudent.stats.active}</strong>
                    <span style={{ fontSize: '0.62rem', color: 'var(--gray)', fontWeight: 500 }}>Lomba Aktif</span>
                  </div>
                  <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.2rem', display: 'block', color: 'var(--green)' }}>{selectedStudent.stats.completed}</strong>
                    <span style={{ fontSize: '0.62rem', color: 'var(--gray)', fontWeight: 500 }}>Lomba Selesai</span>
                  </div>
                  <div style={{ background: 'var(--gray-light)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <strong style={{ fontSize: '1.2rem', display: 'block', color: 'var(--yellow)' }}>{selectedStudent.stats.juara}</strong>
                    <span style={{ fontSize: '0.62rem', color: 'var(--gray)', fontWeight: 500 }}>Total Juara</span>
                  </div>
                </div>

                {/* Active Competitions Details */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>Kompetisi yang Sedang Diikuti</h4>
                  {selectedStudent.competitions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedStudent.competitions.map((comp) => (
                        <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid var(--gray-mid)', borderRadius: 'var(--radius-sm)' }}>
                          <div>
                            <strong style={{ fontSize: '0.78rem', display: 'block' }}>{comp.title}</strong>
                            <span style={{ fontSize: '0.65rem', color: comp.categoryColor, fontWeight: 600 }}>{comp.categoryName}</span>
                          </div>
                          <span className="badge-pill bg-yellow-light text-yellow" style={{ fontSize: '0.62rem' }}>
                            {getStatusLabel(comp.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textAlign: 'center', padding: '10px 0' }}>
                      Siswa sedang tidak terdaftar di kompetisi aktif apapun.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="detail-panel-empty">
                <i className="fa-solid fa-hand-pointer"></i>
                <h3>Pilih Siswa</h3>
                <p>Klik nama siswa di kiri untuk memantau profil lengkap, klaster minat bakat, dan kompetisi terdaftar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
