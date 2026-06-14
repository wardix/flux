import type React from 'react'

interface GoalProgressBarProps {
  progress: number // 0-100
  color?: string // warna bar override
  size?: 'sm' | 'md' // ukuran bar
  showLabel?: boolean // tampilkan persentase, default true
}

export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({
  progress = 0,
  color,
  size = 'sm',
  showLabel = true,
}) => {
  const safeProgress = Math.max(0, Math.min(100, progress))

  // Determine color class based on progress percentage if color override is not provided
  let progressColorClass = 'progress-success'
  if (!color) {
    if (safeProgress < 30) {
      progressColorClass = 'progress-error'
    } else if (safeProgress <= 70) {
      progressColorClass = 'progress-warning'
    }
  }

  const sizeClass = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="flex items-center gap-2 w-full">
      <progress
        className={`progress w-full ${progressColorClass} ${sizeClass}`}
        value={safeProgress}
        max="100"
        style={color ? ({ '--p': color } as React.CSSProperties) : undefined}
      />
      {showLabel && (
        <span className="text-xs font-bold min-w-[32px] text-right text-base-content/70">
          {Math.round(safeProgress)}%
        </span>
      )}
    </div>
  )
}
