import type React from 'react'

interface ColorGridProps {
  colors: string[]
  selectedColor: string | null
  onSelectColor: (color: string) => void
}

export const ColorGrid: React.FC<ColorGridProps> = ({ colors, selectedColor, onSelectColor }) => {
  return (
    <div className="grid grid-cols-3 gap-2 p-1">
      {colors.map((color) => {
        const isSelected = selectedColor === color
        return (
          <button
            key={color}
            type="button"
            className={`w-full aspect-square rounded-lg transition-all border-2 relative overflow-hidden focus:outline-none hover:scale-105 active:scale-95 ${
              isSelected
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-base-200 hover:border-base-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onSelectColor(color)}
            aria-label={`Pilih warna ${color}`}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
