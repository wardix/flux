interface EpicBadgeProps {
  title: string
  color: string
  className?: string
}

export function EpicBadge({ title, color, className = '' }: EpicBadgeProps) {
  return (
    <span
      style={{
        backgroundColor: `${color}15`,
        borderColor: color,
        color: color,
      }}
      className={`badge badge-sm border font-medium px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${className}`}
    >
      💎 {title}
    </span>
  )
}
