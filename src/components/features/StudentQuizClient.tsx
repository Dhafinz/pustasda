'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Props {
  existingBio: string | null
}

interface Suggestion {
  id: number
  title: string
  organizer: string
  category: string
  color: string
  type: string
}

export function StudentQuizClient({ existingBio }: Props) {
  const { addToast, ToastContainer } = useToast()

  const [currentStep, setCurrentStep] = useState(existingBio ? 'result' : 'intro') // intro -> q1 -> q2 -> q3 -> loading -> result
  const [answers, setAnswers] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  // AI Quiz results
  const [interestArea, setInterestArea] = useState('')
  const [explanation, setExplanation] = useState('')
  const [bioText, setBioText] = useState(existingBio || '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const questions = [
    {
      id: 1,
      question: 'Aktivitas mana yang paling membuatmu bersemangat di kala senggang?',
      options: [
        { text: 'Menulis baris kode program atau memikirkan logika pemecahan error', value: 'coding' },
        { text: 'Menggambar ilustrasi, membuat sketsa logo, atau mendesain layout visual', value: 'desain' },
        { text: 'Membaca jurnal/artikel ilmiah, menulis opini, atau meriset fakta', value: 'tulis' },
        { text: 'Merancang ide jualan online, memikirkan strategi marketing, atau presentasi', value: 'bisnis' }
      ]
    },
    {
      id: 2,
      question: 'Dalam kerja kelompok kelas, peran manakah yang biasanya Anda ambil?',
      options: [
        { text: 'Pembuat logika/Fokus pada keandalan sistem teknis tugas', value: 'logic' },
        { text: 'Perancang visual slide presentasi agar estetik & menarik mata', value: 'visual' },
        { text: 'Pencari referensi akurat & penulis utama isi dokumen laporan', value: 'penelitian' },
        { text: 'Koordinator presentasi / Pembicara utama di depan audiens kelas', value: 'presentasi' }
      ]
    },
    {
      id: 3,
      question: 'Proyek impian manakah yang paling menarik untuk Anda kerjakan sekarang?',
      options: [
        { text: 'Membuat aplikasi web portofolio interaktif yang canggih', value: 'web' },
        { text: 'Mendesain ulang identitas brand & logo sekolah secara modern', value: 'logo' },
        { text: 'Menulis esai ilmiah yang memecahkan problem sosial lingkungan sekitar', value: 'esai' },
        { text: 'Membuat pitch deck startup digital untuk mencari investor', value: 'startup' }
      ]
    }
  ]

  const handleStart = () => {
    setAnswers([])
    setCurrentStep('q0') // question index 0
  }

  const handleSelectOption = async (optionValue: string, questionIdx: number) => {
    const newAnswers = [...answers, optionValue]
    setAnswers(newAnswers)

    if (questionIdx < questions.length - 1) {
      setCurrentStep(`q${questionIdx + 1}`)
    } else {
      // Last question completed, trigger AI Analysis
      setCurrentStep('loading')
      setAnalyzing(true)
      try {
        const res = await fetch('/api/ai/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: newAnswers })
        })
        const data = await res.json()

        if (res.ok) {
          setInterestArea(data.interestArea)
          setExplanation(data.explanation)
          setBioText(data.bioText)
          setSuggestions(data.suggestions)
          setCurrentStep('result')
          addToast('Analisis minat bakat AI selesai!', 'success')
        } else {
          addToast(data.error || 'Gagal menganalisis kuis', 'error')
          setCurrentStep('intro')
        }
      } catch {
        addToast('Koneksi terganggu', 'error')
        setCurrentStep('intro')
      } finally {
        setAnalyzing(false)
      }
    }
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <ToastContainer />

      <div className="page-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1>
          <i className="fa-solid fa-brain text-red"></i> Kuis Karakter AI
        </h1>
        <p>Temukan klaster bidang kompetisi dan jalur karir yang paling selaras dengan keunikan minat bakat alami Anda.</p>
      </div>

      {/* STEP: INTRO */}
      {currentStep === 'intro' && (
        <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '18px' }}>🔮</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>Siap Menemukan Bakat Terbaikmu?</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 24px' }}>
            Kuis ini berkolaborasi dengan AI untuk memetakan kepribadian Anda ke dalam beberapa klaster lomba prestasi. Dibutuhkan waktu kurang dari 2 menit!
          </p>
          <button className="btn btn-primary" onClick={handleStart}>
            Mulai Kuis Karakter <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      )}

      {/* STEPS: QUESTIONS */}
      {questions.map((q, idx) => {
        const stepKey = `q${idx}`
        if (currentStep !== stepKey) return null

        const progressPercent = Math.round(((idx + 1) / questions.length) * 100)

        return (
          <div key={q.id} className="card animate-slide-up" style={{ padding: '28px' }}>
            {/* Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: 'var(--gray)', marginBottom: '8px' }}>
              <span>PERTANYAAN {idx + 1} DARI {questions.length}</span>
              <span>{progressPercent}% SELESAI</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: '24px' }}>
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px', lineHeight: 1.5 }}>
              {q.question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  className="btn btn-secondary"
                  onClick={() => handleSelectOption(opt.value, idx)}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '14px 20px',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    border: '1px solid var(--gray-mid)',
                    background: 'var(--white)'
                  }}
                >
                  <span style={{ marginRight: '10px', background: 'var(--gray-light)', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* STEP: LOADING ANALYZING */}
      {currentStep === 'loading' && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="loading-center" style={{ padding: 0, marginBottom: '20px' }}>
            <div className="spinner" style={{ width: '48px', height: '48px' }}></div>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>AI Sedang Menganalisis Jawaban Anda...</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>Menentukan klaster minat bakat dan mencocokkan lomba yang sesuai di database.</p>
        </div>
      )}

      {/* STEP: RESULT */}
      {currentStep === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
            <span style={{ fontSize: '0.72rem', background: 'var(--red-light)', color: 'var(--red)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase' }}>
              Hasil Analisis Minat Bakat
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '10px', marginBottom: '14px' }}>
              {interestArea || 'Klaster Kompetisi Sesuai'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-dark)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 20px' }}>
              {explanation || bioText}
            </p>

            <div style={{ background: 'var(--gray-light)', padding: '12px 16px', borderRadius: 'var(--radius)', fontSize: '0.72rem', color: 'var(--gray)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-circle-info text-blue"></i> Hasil ini telah disimpan secara otomatis ke dalam data profil utama Anda.
            </div>
          </div>

          {/* AI Recommended Competitions list */}
          {suggestions.length > 0 && (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px' }}>
                <i className="fa-solid fa-lightbulb text-yellow" style={{ marginRight: '6px' }}></i> Rekomendasi Lomba untuk Anda
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {suggestions.map((comp) => (
                  <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--gray-mid)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700 }}>{comp.title}</h4>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: '2px' }}>
                        Penyelenggara: {comp.organizer} &bull; Tipe: {comp.type === 'team' ? 'Kelompok' : 'Individu'}
                      </div>
                    </div>
                    <Link href={`/student/explore?id=${comp.id}`} className="btn btn-outline btn-sm" style={{ padding: '6px 12px', fontSize: '0.72rem' }}>
                      Lihat Lomba
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleStart}>
              <i className="fa-solid fa-rotate-left"></i> Ulangi Kuis Karakter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
