interface CompCardProps {
  id: number
  title: string
  category: {
    name: string
    color: string
    icon: string
  }
  organizer: string
  level: string
  type: string
  deadline: string
  poster?: string | null
  linkRegistration?: string | null
  onClick?: () => void
  isSelected?: boolean
}

export function CompCard({ title, category, organizer, level, type, deadline, poster, linkRegistration, onClick, isSelected }: CompCardProps) {
  const levelColors: Record<string, string> = {
    sekolah: 'var(--gray)',
    kota: 'var(--blue)',
    provinsi: 'var(--yellow)',
    nasional: 'var(--red)',
    internasional: 'var(--green)',
  }

  const isPassed = new Date(deadline).getTime() < new Date().setHours(0,0,0,0);

  return (
    <div
      className="comp-card"
      onClick={onClick}
      style={{
        position: 'relative',
        ...(isSelected ? { borderColor: 'var(--red)', boxShadow: 'var(--shadow-red)' } : {}),
        ...(isPassed ? { opacity: 0.6, filter: 'grayscale(40%)' } : {})
      }}
    >
      {isPassed && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'var(--gray-dark)',
          color: 'var(--white)',
          padding: '3px 8px',
          borderRadius: '20px',
          fontSize: '0.6rem',
          fontWeight: 700,
          zIndex: 3
        }}>
          <i className="fa-solid fa-lock" style={{ marginRight: '3px' }}></i> Tutup
        </div>
      )}
      {poster ? (() => {
        const firstPoster = poster.split(',')[0].trim();
        const srcUrl = (firstPoster.startsWith('/') || firstPoster.startsWith('http')) 
          ? firstPoster 
          : `/images/posters/${firstPoster}`;
        return <img src={srcUrl} alt={title} className="comp-card-poster" />;
      })() : (
        <div className="comp-card-poster" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${category.color}15, ${category.color}30)`,
          fontSize: '2rem',
          color: category.color
        }}>
          <i className={`fa-solid ${category.icon}`}></i>
        </div>
      )}

      <div className="comp-card-category" style={{
        background: `${category.color}15`,
        color: category.color
      }}>
        <i className={`fa-solid ${category.icon}`} style={{ fontSize: '0.6rem' }}></i>
        {category.name}
      </div>

      <div className="comp-card-title">{title}</div>
      <div className="comp-card-organizer">{organizer}</div>

      <div className="comp-card-footer">
        <span className="comp-card-level" style={{ color: levelColors[level] || 'var(--gray)' }}>
          <i className="fa-solid fa-layer-group" style={{ marginRight: '4px' }}></i>
          {level}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {linkRegistration && (
            <a
              href={linkRegistration}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Buka link registrasi eksternal"
              style={{ color: 'var(--blue)', fontSize: '0.72rem', display: 'flex', alignItems: 'center' }}
            >
              <i className="fa-solid fa-up-right-from-square"></i>
            </a>
          )}
          <span className="comp-card-deadline">
            <i className="fa-regular fa-clock"></i>
            {deadline}
          </span>
        </div>
      </div>

      {type === 'team' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'var(--blue)',
          color: 'var(--white)',
          padding: '3px 8px',
          borderRadius: '20px',
          fontSize: '0.6rem',
          fontWeight: 700
        }}>
          <i className="fa-solid fa-users" style={{ marginRight: '3px' }}></i> Tim
        </div>
      )}
    </div>
  )
}
