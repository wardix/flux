/**
 * Converts a hex color string to HSL CSS property format: "H S% L%"
 * Matches DaisyUI color format requirements.
 */
export function hexToHSL(hex: string): string {
  // Remove leading hash if present
  let cleanHex = hex.replace(/^#/, '')

  // Handle shorthand format (e.g. "FFF" -> "FFFFFF")
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  if (cleanHex.length !== 6) {
    // Return default blue (corresponding to #2563eb)
    return '221.2 83.2% 53.3%'
  }

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  const hDegrees = Math.round(h * 360)
  const sPercent = Math.round(s * 100)
  const lPercent = Math.round(l * 100)

  return `${hDegrees} ${sPercent}% ${lPercent}%`
}
