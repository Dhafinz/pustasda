import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import Link from 'next/link'
import { ChatbotFAB } from '@/components/ui/ChatbotFAB'

export default async function TeacherDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'teacher') redirect('/login')

  const teacherId = parseInt(session.user.id)

  // Fetch mentorship stats
  const mentorships = await prisma.mentorship.findMany({
    where: { teacherId },
    include: {
      participation: {
        include: {
          user: true,
          competition: true
        }
      }
    }
  })

  const totalBimbingan = mentorships.length
  const pendingRequests = mentorships.filter((m) => m.status === 'pending').length
  const activeBimbingan = mentorships.filter((m) => m.status === 'accepted').length

  // Fetch recent activities submitted by students for this teacher's mentorships
  const recentActivities = await prisma.mentorshipActivity.findMany({
    where: {
      mentorship: {
        teacherId
      }
    },
    include: {
      mentorship: {
        include: {
          participation: {
            include: {
              user: true,
              competition: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  return (
    <DashboardLayout user={session.user} pageTitle="Dashboard Guru">
      <div className="animate-fade-in">
        {/* Welcome Banner */}
        <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, var(--red-dark), #7f0000)' }}>
          <div className="welcome-banner-content">
            <div className="welcome-banner-greeting">
              <i className="fa-solid fa-book-open" style={{ marginRight: '6px' }}></i> Selamat datang kembali Pembimbing,
            </div>
            <h2>{session.user.name}</h2>
            <p className="welcome-banner-quote">"Membimbing siswa menuju puncak prestasi adalah kehormatan besar seorang pendidik."</p>

            <div className="welcome-banner-stats">
              <div className="welcome-stat">
                <i className="fa-solid fa-users"></i>
                <span className="welcome-stat-value">{totalBimbingan}</span> Total Bimbingan
              </div>
              <div className="welcome-stat">
                <i className="fa-solid fa-hourglass-half" style={{ color: 'var(--yellow)' }}></i>
                <span className="welcome-stat-value">{pendingRequests}</span> Pengajuan Pending
              </div>
              <div className="welcome-stat">
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)' }}></i>
                <span className="welcome-stat-value">{activeBimbingan}</span> Bimbingan Aktif
              </div>
            </div>
          </div>
          <div className="welcome-banner-image" style={{ fontSize: '5rem' }}>🧑‍🏫</div>
        </div>

        {/* Dashboard Grid split into 2: Recent requests (left), Recent activities progress (right) */}
        <div className="bento-grid bento-2">
          {/* Left: Pending Mentorship Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-inbox text-red" style={{ marginRight: '6px' }}></i> Pengajuan Bimbingan Baru
              </h3>
              <Link href="/teacher/inbox" className="card-link">Tinjau Semua</Link>
            </div>

            {pendingRequests > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mentorships.filter(m => m.status === 'pending').slice(0, 3).map((req) => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--gray-mid)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <strong style={{ fontSize: '0.82rem', display: 'block' }}>{req.participation.user.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>Lomba: {req.participation.competition.title}</span>
                    </div>
                    <Link href="/teacher/inbox" className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.72rem' }}>
                      Proses
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <i className="fa-regular fa-envelope-open" style={{ fontSize: '2rem' }}></i>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--dark)' }}>Tidak ada pengajuan baru</h4>
                <p style={{ fontSize: '0.75rem' }}>Siswa belum mengirim pengajuan bimbingan baru ke Anda.</p>
              </div>
            )}
          </div>

          {/* Right: Recent Progres/Activities */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-chart-line text-blue" style={{ marginRight: '6px' }}></i> Aktivitas Progres Terbaru
              </h3>
              <Link href="/teacher/bimbingan" className="card-link">Lihat Detail</Link>
            </div>

            {recentActivities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentActivities.map((act) => (
                  <div key={act.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.8rem' }}>{act.title}</strong>
                      <span style={{ 
                        fontSize: '0.62rem', 
                        background: act.status === 'approved' ? 'var(--green-light)' : act.status === 'rejected' ? 'var(--red-light)' : 'var(--yellow-light)', 
                        color: act.status === 'approved' ? 'var(--green)' : act.status === 'rejected' ? 'var(--red)' : 'var(--yellow)', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        {act.status === 'approved' ? 'Disetujui' : act.status === 'rejected' ? 'Ditolak' : 'Pending ACC'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '2px' }}>
                      Siswa: {act.mentorship.participation.user.name} &bull; Lomba: {act.mentorship.participation.competition.title}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <i className="fa-solid fa-timeline" style={{ fontSize: '2rem' }}></i>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--dark)' }}>Belum ada progres aktivitas</h4>
                <p style={{ fontSize: '0.75rem' }}>Aktivitas bimbingan akan tampil setelah siswa membuat progres.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatbotFAB />
    </DashboardLayout>
  )
}
