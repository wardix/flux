import { describe, test, expect } from 'vitest'
import { detectEmbedProvider, getEmbedUrl, isEmbeddableUrl } from '../../src/lib/embedHelpers'

describe('detectEmbedProvider', () => {
  test('should detect YouTube URL', () => {
    const provider = detectEmbedProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(provider?.name).toBe('YouTube')
  })

  test('should detect YouTube short URL', () => {
    const provider = detectEmbedProvider('https://youtu.be/dQw4w9WgXcQ')
    expect(provider?.name).toBe('YouTube')
  })

  test('should detect Figma URL', () => {
    const provider = detectEmbedProvider('https://www.figma.com/file/abc123/Design')
    expect(provider?.name).toBe('Figma')
  })

  test('should detect Google Docs URL', () => {
    const provider = detectEmbedProvider('https://docs.google.com/document/d/abc123/edit')
    expect(provider?.name).toBe('Google Docs')
  })

  test('should detect CodeSandbox URL', () => {
    const provider = detectEmbedProvider('https://codesandbox.io/s/my-project-abc123')
    expect(provider?.name).toBe('CodeSandbox')
  })

  test('should detect Loom URL', () => {
    const provider = detectEmbedProvider('https://www.loom.com/share/abc123def456')
    expect(provider?.name).toBe('Loom')
  })

  test('should return null for unknown URL', () => {
    expect(detectEmbedProvider('https://example.com')).toBeNull()
    expect(detectEmbedProvider('https://github.com/user/repo')).toBeNull()
  })
})

describe('getEmbedUrl', () => {
  test('should transform YouTube watch URL to embed', () => {
    const embedUrl = getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  test('should transform Loom share URL to embed', () => {
    const embedUrl = getEmbedUrl('https://www.loom.com/share/abc123')
    expect(embedUrl).toBe('https://www.loom.com/embed/abc123')
  })

  test('should return null for unknown URL', () => {
    expect(getEmbedUrl('https://example.com')).toBeNull()
  })
})

describe('isEmbeddableUrl', () => {
  test('should return true for supported URLs', () => {
    expect(isEmbeddableUrl('https://www.youtube.com/watch?v=abc')).toBe(true)
    expect(isEmbeddableUrl('https://www.figma.com/file/abc/test')).toBe(true)
  })

  test('should return false for unsupported URLs', () => {
    expect(isEmbeddableUrl('https://example.com')).toBe(false)
    expect(isEmbeddableUrl('javascript:alert(1)')).toBe(false)
  })
})
