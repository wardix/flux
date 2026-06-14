import type React from 'react'
import { useNavigate } from 'react-router-dom'

interface CardGoalBadgeProps {
  goals: { id: number; title: string; progress: number }[]
}

export const CardGoalBadge: React.FC<CardGoalBadgeProps> = ({ goals = [] }) => {
  const navigate = useNavigate()

  if (goals.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {goals.map((g) => (
        <div
          key={g.id}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            navigate('/goals')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation()
              navigate('/goals')
            }
          }}
          className="badge badge-sm badge-outline border-primary/40 hover:bg-primary/5 transition-all text-xs font-semibold py-2 px-2 max-w-[150px] truncate flex items-center gap-1.5 cursor-pointer text-primary/80"
          title={`Goals: ${g.title} (${Math.round(g.progress)}% progress)`}
        >
          <span>🎯</span>
          <span className="truncate">{g.title}</span>
          <span className="text-[10px] opacity-60 font-bold">{Math.round(g.progress)}%</span>
        </div>
      ))}
    </div>
  )
}
