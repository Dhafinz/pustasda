'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { loginAction } from './actions'
import logoImg from './logo.png'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginAction(email, password)

      if (!result?.success) {
        setError(result?.error || 'Email atau password salah. Silakan coba lagi.')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      // NextAuth v5 throws NEXT_REDIRECT on success — this is expected
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div style={{ maxWidth: '400px', margin: '0 auto 24px auto', display: 'flex', justifyContent: 'center' }}>
            <Image 
              src={logoImg} 
              alt="Logo Pustasda" 
              priority
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          </div>
          <p>
            Pusat Prestasi SMK Telkom Sidoarjo.<br />
            Platform digital untuk mengelola, memantau, dan mendukung pencapaian prestasi dari tingkat sekolah hingga internasional.
            </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            fontSize: '0.78rem',
            opacity: 0.7
          }}>
            <span><i className="fa-solid fa-trophy" style={{ marginRight: '6px' }}></i>Manajemen Lomba</span>
            <span><i className="fa-solid fa-users" style={{ marginRight: '6px' }}></i>Tim & Bimbingan</span>
            <span><i className="fa-solid fa-chart-line" style={{ marginRight: '6px' }}></i>Analisis Prestasi</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="auth-right">
        <div className="auth-form-box">
          <h2 className="auth-form-title">Selamat Datang</h2>
          <p className="auth-form-subtitle">
            Masuk ke akun PUSTASDA Anda untuk melanjutkan
          </p>

          {error && (
            <div className="auth-error">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                  Memproses...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  Masuk
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '28px',
            padding: '16px',
            background: 'var(--gray-light)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--gray)',
            lineHeight: 1.6
          }}>
            <p style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>
              <i className="fa-solid fa-info-circle" style={{ marginRight: '6px', color: 'var(--red)' }}></i>
              Informasi
            </p>
            <p>
              Akun hanya bisa dibuat oleh Administrator. Jika belum memiliki akun,
              hubungi admin sekolah Anda.
            </p>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.72rem',
            color: 'var(--gray)'
          }}>
            © 2026 PUSTASDA — SMK Telkom Sidoarjo
          </div>
        </div>
      </div>
    </div>
  )
}
