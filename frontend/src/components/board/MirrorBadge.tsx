import type React from 'react'

interface MirrorBadgeProps {
  sourceBoardTitle: string
  onClick?: () => void
}

export const MirrorBadge: React.FC<MirrorBadgeProps> = ({ sourceBoardTitle, onClick }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
      className={`badge badge-ghost badge-sm gap-1 cursor-pointer hover:bg-base-200 border-dashed border-base-300 py-2.5 px-2.5 flex items-center select-none text-[10px] uppercase tracking-wider font-bold text-base-content/60`}
      title={`Mirrored from ${sourceBoardTitle}`}
    >
      <span>🔗</span>
      <span>Mirror of {sourceBoardTitle}</span>
    </div>
  )
}
