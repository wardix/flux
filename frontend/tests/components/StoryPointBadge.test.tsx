import { render, screen } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX in Vitest environment
import React from 'react'
import { describe, expect, test } from 'vitest'
import { StoryPointBadge } from '../../src/components/board/StoryPointBadge'

describe('StoryPointBadge', () => {
  test('should render story points number', () => {
    render(<StoryPointBadge points={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('should use success color for low effort (1-3)', () => {
    const { container } = render(<StoryPointBadge points={2} />)
    expect(container.firstChild).toHaveClass('badge-success')
  })

  test('should use warning color for medium effort (5-8)', () => {
    const { container } = render(<StoryPointBadge points={5} />)
    expect(container.firstChild).toHaveClass('badge-warning')
  })

  test('should use error color for high effort (13+)', () => {
    const { container } = render(<StoryPointBadge points={13} />)
    expect(container.firstChild).toHaveClass('badge-error')
  })

  test('should have tooltip with "Story Points: X"', () => {
    render(<StoryPointBadge points={8} />)
    const badge = screen.getByText('8')
    expect(badge.closest('[title]')).toHaveAttribute('title', 'Story Points: 8')
  })
})
