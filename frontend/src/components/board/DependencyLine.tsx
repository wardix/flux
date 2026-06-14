interface DependencyLineProps {
  fromCardId: number
  toCardId: number
  fromRect: DOMRect
  toRect: DOMRect
  isCompleted?: boolean
}

export function DependencyLine({ fromRect, toRect, isCompleted }: DependencyLineProps) {
  // We need to draw a line from the center-right of the fromCard to the center-left of the toCard.
  const startX = fromRect.right
  const startY = fromRect.top + fromRect.height / 2
  const endX = toRect.left
  const endY = toRect.top + toRect.height / 2

  // Make it a curved path
  const controlPointX1 = startX + 50
  const controlPointY1 = startY
  const controlPointX2 = endX - 50
  const controlPointY2 = endY

  const pathD = `M ${startX} ${startY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${endX} ${endY}`

  const colorClass = isCompleted ? 'stroke-success' : 'stroke-error'

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <marker
          id={`arrowhead-${isCompleted ? 'success' : 'error'}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            className={isCompleted ? 'fill-success' : 'fill-error'}
          />
        </marker>
      </defs>
      <path
        d={pathD}
        className={`${colorClass} fill-none`}
        strokeWidth="2"
        markerEnd={`url(#arrowhead-${isCompleted ? 'success' : 'error'})`}
      />
    </svg>
  )
}
