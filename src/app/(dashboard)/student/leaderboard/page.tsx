import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'

export default async function StudentLeaderboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'student') redirect('/login')

  const currentUserId = parseInt(session.user.id)

  // Fetch all students for leaderboard computation
  const students = await prisma.user.findMany({
    where: { role: 'student', isActive: true },
    include: {
      studentProfile: {
        select: { kelas: true, jurusan: true }
      },
      participations: {
        select: { result: true, status: true }
      }
    }
  })

  const computed = students.map((user) => {
    const totalLomba = user.participations.length
    const totalSubmit = user.participations.filter(p => ['submitted', 'completed'].includes(p.status)).length
    const totalJuara = user.participations.filter(p =>
      ['juara_1', 'juara_2', 'juara_3', 'juara_harapan'].includes(p.result)
    ).length

    // Weight points
    let points = 0
    user.participations.forEach((p) => {
      if (p.result === 'juara_1') points += 3.0
      else if (p.result === 'juara_2') points += 2.0
      else if (p.result === 'juara_3') points += 1.0
      else if (['juara_harapan', 'favorit', 'terpilih'].includes(p.result)) points += 0.5
      else if (['submitted', 'completed', 'registered', 'in_progress'].includes(p.status)) points += 0.2
    })

    points = Math.round(points * 10) / 10

    return {
      id: user.id,
      name: user.name,
      photo: user.photo,
      kelas: user.studentProfile?.kelas || '-',
      jurusan: user.studentProfile?.jurusan || '-',
      poin: points,
      juara: totalJuara,
      lomba: totalLomba,
      submit: totalSubmit,
      isYou: user.id === currentUserId
    }
  })

  // Sort leaderboard
  const sorted = computed.sort((a, b) => b.poin - a.poin || b.juara - a.juara || b.lomba - a.lomba)

  // Find user's specific rank
  const myRankIdx = sorted.findIndex((s) => s.id === currentUserId)
  const myRank = myRankIdx !== -1 ? { rank: myRankIdx + 1, ...sorted[myRankIdx] } : null

  return (
    <DashboardLayout user={session.user} pageTitle="Leaderboard">
      <div className="animate-fade-in">
        {/* Leaderboard Title */}
        <div className="page-header">
          <h1>
            <i className="fa-solid fa-ranking-star text-yellow"></i> Leaderboard Siswa Berprestasi
          </h1>
          <p>Peringkat kompetitif berdasarkan akumulasi perolehan poin keikutsertaan dan prestasi juara lomba.</p>
        </div>

        {/* Current User Rank Stats */}
        {myRank && (
          <div className="leaderboard-position">
            <i className="fa-solid fa-trophy" style={{ fontSize: '1.8rem', color: 'var(--yellow)' }}></i>
            <div>
              <div className="leaderboard-position-title">
                Posisimu saat ini: Peringkat #{myRank.rank}
              </div>
              <div className="leaderboard-position-sub">
                Skor Akumulasi: <strong>{myRank.poin} poin</strong> &bull; Juara: <strong>{myRank.juara} kali</strong> &bull; Lomba Diikuti: <strong>{myRank.lomba} kompetisi</strong> &bull; Karya Disubmit: <strong>{myRank.submit} karya</strong>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table Grid */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800 }}>Peringkat Lengkap</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{sorted.length} siswa terdaftar</span>
          </div>

          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Siswa</th>
                <th style={{ textAlign: 'right' }}>Lomba</th>
                <th style={{ textAlign: 'right' }}>Submit</th>
                <th style={{ textAlign: 'right' }}>Juara</th>
                <th style={{ textAlign: 'right' }}>Total Poin</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => (
                <tr key={item.id} style={item.isYou ? { background: 'var(--red-light)' } : {}}>
                  <td>
                    <div className="leaderboard-rank-badge">
                      {idx === 0 ? <span className="rank-medal">🥇</span> :
                       idx === 1 ? <span className="rank-medal">🥈</span> :
                       idx === 2 ? <span className="rank-medal">🥉</span> :
                       <span style={{ fontWeight: 700, color: 'var(--gray-dark)', marginLeft: '6px' }}>{idx + 1}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="leaderboard-student">
                      <div className="leaderboard-student-avatar" style={{ background: idx < 3 ? 'var(--red)' : 'var(--gray)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.photo && item.photo !== 'default-avatar.png' && item.photo !== 'default_avatar.png' ? (
                          <img src={item.photo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          item.name.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('') || 'U'
                        )}
                      </div>
                      <div>
                        <div className="leaderboard-student-name" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                          {item.name}
                          {item.isYou && <span className="you-badge">Kamu</span>}
                        </div>
                        <div className="leaderboard-student-class" style={{ fontSize: '0.7rem' }}>
                          {item.jurusan} &bull; Kelas {item.kelas}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{item.lomba}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{item.submit}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--yellow)' }}>{item.juara} kali</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--red)', fontSize: '0.9rem' }}>
                    {item.poin} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ChatbotFAB />
    </DashboardLayout>
  )
}
