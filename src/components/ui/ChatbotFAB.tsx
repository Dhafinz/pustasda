'use client'

import { useState } from 'react'

export function ChatbotFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user'; content: string }>>([
    { role: 'bot', content: 'Halo! 👋 Saya asisten PUSTASDA. Ada yang bisa saya bantu tentang lomba, tim, atau fitur platform ini?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }]
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'bot', content: data.reply || 'Maaf, saya tidak bisa memproses permintaan Anda.' }])
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: 'Maaf, terjadi kesalahan. Coba lagi nanti ya.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: 'Tidak dapat terhubung ke server. Pastikan koneksi internet Anda.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem'
              }}>
                🤖
              </div>
              <div>
                <h3>PUSTASDA Bot</h3>
                <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>Asisten Virtual</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer', fontSize: '1rem' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot" style={{ display: 'flex', gap: '4px' }}>
                <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                <span style={{ marginLeft: '8px' }}>Mengetik...</span>
              </div>
            )}
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ketik pesan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} disabled={loading}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button className="chatbot-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <i className="fa-solid fa-xmark"></i>
        ) : (
          <>
            <i className="fa-solid fa-robot"></i>
            <span className="pulse-ring"></span>
          </>
        )}
      </button>
    </>
  )
}
