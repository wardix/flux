import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, test, vi } from 'vitest'
import { CardCoverPicker } from '../../src/components/board/CardCoverPicker'

describe('CardCoverPicker', () => {
  const defaultProps = {
    currentCoverColor: null,
    currentCoverImageUrl: null,
    onSelectColor: vi.fn(),
    onSelectImage: vi.fn(),
    onRemove: vi.fn(),
    isOpen: true,
    onClose: vi.fn(),
  }

  test('should render color grid', () => {
    render(<CardCoverPicker {...defaultProps} />)
    const colorButtons = screen.getAllByRole('button')
    expect(colorButtons.length).toBeGreaterThan(0)
  })

  test('should call onSelectColor when color clicked', () => {
    render(<CardCoverPicker {...defaultProps} />)
    const firstColor = screen.getAllByRole('button', { name: /^Pilih warna/i })[0]
    fireEvent.click(firstColor)
    expect(defaultProps.onSelectColor).toHaveBeenCalled()
  })

  test('should show Photos tab', () => {
    render(<CardCoverPicker {...defaultProps} />)
    expect(screen.getByText(/photos/i)).toBeDefined()
  })

  test('should show Remove button when cover is set', () => {
    render(<CardCoverPicker {...defaultProps} currentCoverColor="#1e40af" />)
    expect(screen.getByText(/remove/i)).toBeDefined()
  })

  test('should not render when isOpen is false', () => {
    const { container } = render(<CardCoverPicker {...defaultProps} isOpen={false} />)
    expect(container.children.length).toBe(0)
  })
})
