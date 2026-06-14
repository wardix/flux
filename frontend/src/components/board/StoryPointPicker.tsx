interface StoryPointPickerProps {
  value: number | null
  onChange: (val: number | null) => void
  disabled?: boolean
}

export function StoryPointPicker({ value, onChange, disabled = false }: StoryPointPickerProps) {
  const points = [1, 2, 3, 5, 8, 13, 21]

  return (
    <div className="flex flex-wrap gap-2">
      {points.map((p) => {
        const isSelected = value === p
        return (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (isSelected) {
                onChange(null)
              } else {
                onChange(p)
              }
            }}
            className={`btn btn-sm w-9 h-9 rounded-lg font-bold border transition-all duration-200 ${
              isSelected
                ? 'btn-primary text-white shadow-md'
                : 'btn-outline border-base-300 hover:border-primary/50 text-base-content/75 hover:bg-primary/5'
            }`}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}
