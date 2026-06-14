interface StoryPointBadgeProps {
  points: number
}

export function StoryPointBadge({ points }: StoryPointBadgeProps) {
  let badgeColor = 'badge-success text-white'

  if (points >= 13) {
    badgeColor = 'badge-error text-white'
  } else if (points >= 5) {
    badgeColor = 'badge-warning text-warning-content'
  }

  return (
    <span
      title={`Story Points: ${points}`}
      className={`badge badge-sm font-bold border-none ${badgeColor}`}
    >
      {points}
    </span>
  )
}
