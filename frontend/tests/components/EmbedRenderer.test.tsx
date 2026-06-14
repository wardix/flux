import React from 'react'
import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EmbedRenderer } from '../../src/components/board/EmbedRenderer'

describe('EmbedRenderer', () => {
  test('should render YouTube embed iframe', () => {
    const { container } = render(
      <EmbedRenderer
        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        provider="YouTube"
        size="medium"
        originalUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      />
    )
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeDefined()
    expect(iframe?.src).toContain('youtube.com/embed')
  })

  test('should render Figma embed iframe', () => {
    const { container } = render(
      <EmbedRenderer
        src="https://www.figma.com/embed?embed_host=flux&url=..."
        provider="Figma"
        size="medium"
        originalUrl="https://www.figma.com/file/abc123/Design"
      />
    )
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeDefined()
    expect(iframe?.src).toContain('figma.com/embed')
  })

  test('should apply size classes', () => {
    const { container } = render(
      <EmbedRenderer
        src="https://www.youtube.com/embed/test"
        provider="YouTube"
        size="small"
        originalUrl="https://youtube.com/watch?v=test"
      />
    )
    expect(container.querySelector('.max-w-sm')).toBeDefined()
  })

  test('should apply full width class', () => {
    const { container } = render(
      <EmbedRenderer
        src="https://www.youtube.com/embed/test"
        provider="YouTube"
        size="full"
        originalUrl="https://youtube.com/watch?v=test"
      />
    )
    expect(container.querySelector('.w-full')).toBeDefined()
  })

  test('should sandbox iframe', () => {
    const { container } = render(
      <EmbedRenderer
        src="https://www.youtube.com/embed/test"
        provider="YouTube"
        size="medium"
        originalUrl="https://youtube.com/watch?v=test"
      />
    )
    const iframe = container.querySelector('iframe')
    expect(iframe?.getAttribute('sandbox')).toContain('allow-scripts')
  })
})
