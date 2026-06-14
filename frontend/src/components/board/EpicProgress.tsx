interface EpicProgressProps {
  percentage: number
  totalCards: number
  completedCards: number
  className?: string
}

export function EpicProgress({
  percentage,
  totalCards,
  completedCards,
  className = '',
}: EpicProgressProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-base-content/60">Progress</span>
        <span className="font-semibold text-primary">
          {percentage}% ({completedCards}/{totalCards})
        </span>
      </div>
      <progress
        className="progress progress-primary w-full bg-base-200"
        value={percentage}
        max="100"
      />
    </div>
  )
}
