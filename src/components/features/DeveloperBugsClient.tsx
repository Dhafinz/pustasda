'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

interface BugItem {
  id: number
  title: string
  module: string
  severity: string
  detectedAt: string
}

export function DeveloperBugsClient({ initialBugs }: { initialBugs: BugItem[] }) {
  const { addToast, ToastContainer } = useToast()
  const [bugs, setBugs] = useState<BugItem[]>(initialBugs)
  const [selectedBug, setSelectedBug] = useState<BugItem | null>(initialBugs[0])
  const [loading, setLoading] = useState(false)
  const [fixAdvice, setFixAdvice] = useState('')

  const handleAnalyzeBug = async (bugId: number) => {
    setLoading(true)
    setFixAdvice('')
    try {
      const res = await fetch('/api/developer/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugId })
      })

      const data = await res.json()
      if (res.ok) {
        setFixAdvice(data.advice)
        addToast('Analisis AI fix bug berhasil di-load!', 'success')
      } else {
        addToast(data.error || 'Gagal menganalisis bug', 'error')
      }
    } catch {
      addToast('Koneksi terganggu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high': return <span className="badge-pill badge-red" style={{ fontSize: '0.62rem' }}>High</span>
      case 'medium': return <span className="badge-pill badge-yellow" style={{ fontSize: '0.62rem' }}>Medium</span>
      default: return <span className="badge-pill badge-gray" style={{ fontSize: '0.62rem' }}>Low</span>
    }
  }

  return (
    <div className="animate-fade-in">
      <ToastContainer />

      <div className="page-header">
        <h1>
          <i className="fa-solid fa-bug text-red"></i> AI Bug Analyzer
        </h1>
        <p>Tinjau kegagalan runtime modul terdeteksi dan dapatkan saran solusi perbaikan dari Claude AI secara otomatis.</p>
      </div>

      <div className="explore-layout">
        {/* Left Column: Bug list */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bugs.map((bug) => (
              <div
                key={bug.id}
                className={`card ${selectedBug?.id === bug.id ? 'active' : ''}`}
                onClick={() => { setSelectedBug(bug); setFixAdvice(''); }}
                style={{
                  cursor: 'pointer',
                  border: selectedBug?.id === bug.id ? '1.5px solid var(--red)' : '1px solid rgba(0,0,0,0.04)',
                  boxShadow: selectedBug?.id === bug.id ? 'var(--shadow-red)' : 'var(--shadow)',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge-pill bg-blue-light text-blue" style={{ textTransform: 'uppercase', fontSize: '0.62rem' }}>
                    {bug.module}
                  </span>
                  {getSeverityBadge(bug.severity)}
                </div>
                <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--dark)' }}>{bug.title}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Fixing Suggestions panel */}
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h3 className="section-title">
              <i className="fa-solid fa-wand-magic-sparkles text-red"></i> Saran AI Fix Bug
            </h3>
          </div>

          <div className="detail-panel-body">
            {selectedBug ? (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{selectedBug.title}</h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginBottom: '16px' }}>
                  Modul: <strong>{selectedBug.module.toUpperCase()}</strong> &bull; Terdeteksi: {new Date(selectedBug.detectedAt).toLocaleTimeString('id-ID')}
                </p>

                {fixAdvice ? (
                  <div style={{ background: 'var(--gray-light)', padding: '14px', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--green)', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--dark-mid)', marginBottom: '16px' }}>
                    <strong style={{ display: 'block', color: 'var(--green)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '6px' }}>AI Recommended Solution:</strong>
                    {fixAdvice}
                  </div>
                ) : null}

                <button className="btn btn-primary btn-block" onClick={() => handleAnalyzeBug(selectedBug.id)} disabled={loading}>
                  {loading ? 'Menganalisis Bug...' : <><i className="fa-solid fa-brain"></i> Jalankan Saran AI Fix</>}
                </button>
              </div>
            ) : (
              <div className="detail-panel-empty">
                <i className="fa-solid fa-hand-pointer"></i>
                <h3>Pilih Masalah Bug</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
