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

  const [currentStep, setCurrentStep] = useState(existingBio ? 'result' : 'intro') // intro -> q0 -> q1 -> q2 -> q3 -> q4 -> loading -> result
  const [answers, setAnswers] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  // AI Quiz results matching rich API output
  const [interestArea, setInterestArea] = useState('')
  const [explanation, setExplanation] = useState('')
  const [bioText, setBioText] = useState(existingBio || '')
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([])
  const [strengthAnalysis, setStrengthAnalysis] = useState('')
  const [growthAreas, setGrowthAreas] = useState('')
  const [recommendedPath, setRecommendedPath] = useState('')
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
    },
    {
      id: 4,
      question: 'Gaya belajar dan penyerapan materi kompetensi yang paling efektif bagi Anda?',
      options: [
        { text: 'Mencoba langsung lewat praktik mandiri, coding, atau merakit prototype', value: 'praktik' },
        { text: 'Mempelajari grafis visual, melihat bagan alir, atau tutorial video interaktif', value: 'visual' },
        { text: 'Membaca ebook/dokumentasi resmi, modul tertulis, dan menganalisis riset lama', value: 'membaca' },
        { text: 'Berdiskusi dua arah, curah ide kelompok, serta tanya jawab interaktif', value: 'diskusi' }
      ]
    },
    {
      id: 5,
      question: 'Aspirasi profesi atau peran impian Anda pasca kelulusan sekolah?',
      options: [
        { text: 'Software Developer, Systems Analyst, atau Cloud Architect teknis', value: 'engineer' },
        { text: 'UI/UX Designer, Creative Director, atau Visual Artist digital', value: 'designer' },
        { text: 'Riset Akademis, Peneliti Sains Terapan, atau Konsultan Kebijakan', value: 'researcher' },
        { text: 'Digital Entrepreneur, Product Manager, atau Business Development', value: 'entrepreneur' }
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
          setPersonalityTraits(data.personalityTraits || [])
          setStrengthAnalysis(data.strengthAnalysis || '')
          setGrowthAreas(data.growthAreas || '')
          setRecommendedPath(data.recommendedPath || '')
          setSuggestions(data.suggestions || [])
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

  const getTraitIcon = (index: number) => {
    const icons = ['fa-bolt', 'fa-seedling', 'fa-gears', 'fa-award']
    return icons[index % icons.length]
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <ToastContainer />

      <div className="page-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1>
          <i className="fa-solid fa-brain text-red"></i> Kuis Karakter AI
        </h1>
        <p>Temukan klaster bidang kompetisi dan jalur karir yang paling selaras dengan keunikan minat bakat alami Anda.</p>
      </div>

      {/* STEP: INTRO */}
      {currentStep === 'intro' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '3rem', color: 'var(--red)', marginBottom: '18px' }}>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px' }}>Temukan Potensi Terbaikmu dengan AI</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 26px' }}>
            Kuis ini dirancang untuk memetakan kepribadian, gaya belajar, dan bakat dominan Anda. AI akan menganalisis data riwayat lomba Anda di database untuk memberikan rekomendasi spesifik.
          </p>
          <button className="btn btn-primary" onClick={handleStart}>
            Mulai Kuis Minat Bakat <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
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

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '20px', lineHeight: 1.5 }}>
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
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>AI Sedang Menganalisis Potensi Anda...</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>Menghubungkan kecenderungan jawaban kuis dengan histori prestasi Anda di PUSTASDA.</p>
        </div>
      )}

      {/* STEP: RESULT */}
      {currentStep === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Hero Card */}
          <div className="card animate-slide-up" style={{ textAlign: 'center', padding: '36px 28px', background: 'linear-gradient(180deg, var(--red-light) 0%, var(--white) 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '3.5rem', color: 'var(--red)', marginBottom: '14px' }}>
              <i className="fa-solid fa-bullseye"></i>
            </div>
            <span style={{ fontSize: '0.68rem', background: 'var(--red-light)', color: 'var(--red)', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Hasil Analisis Minat Bakat
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '12px', marginBottom: '14px', color: 'var(--black)' }}>
              {interestArea || 'Klaster Kompetisi Anda'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-dark)', lineHeight: 1.65, maxWidth: '640px', margin: '0 auto 16px' }}>
              {explanation}
            </p>
            {bioText && (
              <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--gray)', marginTop: '8px' }}>
                " {bioText} "
              </div>
            )}
            <div style={{ marginTop: '24px', background: 'var(--gray-light)', padding: '12px 18px', borderRadius: 'var(--radius)', fontSize: '0.72rem', color: 'var(--gray-dark)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-circle-check text-green"></i> Hasil profil bakat terbaru telah disematkan di biografi utama Anda secara otomatis.
            </div>
          </div>

          {/* Personality Traits Badges */}
          {personalityTraits.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {personalityTraits.map((trait, index) => (
                <div key={index} className="card animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderLeft: '4px solid var(--red)' }}>
                  <div style={{ fontSize: '1.25rem', color: 'var(--red)', background: 'var(--red-light)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                    <i className={`fa-solid ${getTraitIcon(index)}`}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>Karakter Utama</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--black)' }}>{trait}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Two-Column Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            {/* Detailed Analysis Section */}
            <div className="card animate-slide-up" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--gray-mid)', paddingBottom: '12px' }}>
                <i className="fa-solid fa-square-poll-vertical text-red"></i> Hasil Profil Mandiri Siswa
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {strengthAnalysis && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--black)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-circle-nodes text-green"></i> Analisis Kekuatan & Riwayat
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-dark)', lineHeight: 1.55 }}>{strengthAnalysis}</p>
                  </div>
                )}

                {growthAreas && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--black)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-circle-exclamation text-yellow"></i> Area Pengembangan Diri
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-dark)', lineHeight: 1.55 }}>{growthAreas}</p>
                  </div>
                )}

                {recommendedPath && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--black)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-route text-blue"></i> Rekomendasi Karir & Skill
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-dark)', lineHeight: 1.55 }}>{recommendedPath}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="card animate-slide-up" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--gray-mid)', paddingBottom: '12px' }}>
                <i className="fa-solid fa-lightbulb text-yellow"></i> Rekomendasi Kompetisi untuk Diikuti
              </h3>

              {suggestions.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {suggestions.map((comp) => (
                    <div key={comp.id} className="card-hover-scale" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--gray-mid)', borderRadius: 'var(--radius)', background: 'var(--white)' }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', background: `${comp.color}15`, color: comp.color, padding: '2px 8px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                          {comp.category}
                        </span>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, marginTop: '8px', marginBottom: '4px', color: 'var(--black)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {comp.title}
                        </h4>
                        <div style={{ fontSize: '0.68rem', color: 'var(--gray)', marginBottom: '14px' }}>
                          Penyelenggara: {comp.organizer}
                        </div>
                      </div>
                      <Link href={`/student/explore?id=${comp.id}`} className="btn btn-outline btn-sm" style={{ width: '100%', textAlign: 'center', padding: '6px 0', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        Lihat Detail Lomba <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--gray)', textAlign: 'center', padding: '20px 0' }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i> Tidak ada kompetisi aktif yang sesuai saat ini. Silakan hubungi admin atau cari di menu Eksplor.
                </p>
              )}
            </div>

          </div>

          {/* Reset Action */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={handleStart} style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-rotate-left"></i> Ulangi Kuis Karakter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
