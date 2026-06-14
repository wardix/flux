interface SubtaskProgressProps {
  completed: number
  total: number
}

export function SubtaskProgress({ completed, total }: SubtaskProgressProps) {
  if (total === 0) return null

  return (
    <div className="flex items-center gap-2 text-[10px] text-base-content/50 font-medium bg-base-200/50 px-1.5 py-0.5 rounded border border-base-300/30">
      <span>
        ☑️ {completed}/{total}
      </span>
      <progress className="progress progress-primary w-16 h-1" value={completed} max={total} />
    </div>
  )
}
