interface StatCardProps {
  title: string
  value: number | string
  icon: string
  color: string
  bgColor?: string
}

export function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  const bg = bgColor || `${color}15`

  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: bg, color }}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <div className="stat-card-value" style={{ color }}>{value}</div>
        <div className="stat-card-label">{title}</div>
      </div>
    </div>
  )
}
