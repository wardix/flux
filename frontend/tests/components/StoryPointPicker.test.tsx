import { fireEvent, render, screen } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX in Vitest environment
import React from 'react'
import { describe, expect, test, vi } from 'vitest'
import { StoryPointPicker } from '../../src/components/board/StoryPointPicker'

describe('StoryPointPicker', () => {
  test('should render all Fibonacci numbers', () => {
    render(<StoryPointPicker value={null} onChange={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('13')).toBeInTheDocument()
    expect(screen.getByText('21')).toBeInTheDocument()
  })

  test('should highlight selected value', () => {
    render(<StoryPointPicker value={5} onChange={vi.fn()} />)
    const btn = screen.getByText('5')
    expect(btn.closest('button')).toHaveClass('btn-primary')
  })

  test('should call onChange with new value when clicking a number', () => {
    const onChange = vi.fn()
    render(<StoryPointPicker value={null} onChange={onChange} />)
    fireEvent.click(screen.getByText('8'))
    expect(onChange).toHaveBeenCalledWith(8)
  })

  test('should call onChange with null when clicking selected value (deselect)', () => {
    const onChange = vi.fn()
    render(<StoryPointPicker value={5} onChange={onChange} />)
    fireEvent.click(screen.getByText('5'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  test('should be disabled when disabled prop is true', () => {
    render(<StoryPointPicker value={5} onChange={vi.fn()} disabled />)
    const buttons = screen.getAllByRole('button')
    for (const btn of buttons) {
      expect(btn).toBeDisabled()
    }
  })

  test('should not highlight any button when value is null', () => {
    render(<StoryPointPicker value={null} onChange={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    for (const btn of buttons) {
      expect(btn).not.toHaveClass('btn-primary')
    }
  })
})
