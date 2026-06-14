import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViewSwitcher } from '../../src/components/board/ViewSwitcher'

describe('ViewSwitcher', () => {
  test('should render all view tabs', () => {
    render(<ViewSwitcher activeView="kanban" onViewChange={vi.fn()} />)
    expect(screen.getByText(/kanban/i)).toBeInTheDocument()
    expect(screen.getByText(/table/i)).toBeInTheDocument()
    expect(screen.getByText(/calendar/i)).toBeInTheDocument()
    expect(screen.getByText(/timeline/i)).toBeInTheDocument()
  })

  test('should highlight active view tab', () => {
    render(<ViewSwitcher activeView="table" onViewChange={vi.fn()} />)
    expect(screen.getByText(/table/i).closest('button')).toHaveClass('tab-active')
  })

  test('should call onViewChange when tab clicked', () => {
    const onViewChange = vi.fn()
    render(<ViewSwitcher activeView="kanban" onViewChange={onViewChange} />)
    fireEvent.click(screen.getByText(/calendar/i))
    expect(onViewChange).toHaveBeenCalledWith('calendar')
  })
})
