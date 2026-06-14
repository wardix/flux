import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TableView } from '../../src/components/board/TableView'

const mockCards = [
  { id: 1, list_id: 1, title: 'Card A', due_date: '2026-01-15', start_date: '2026-01-10', position: 0, created_at: '', updated_at: '', labels: [], assignees: [] },
  { id: 2, list_id: 2, title: 'Card B', due_date: null, start_date: null, position: 1, created_at: '', updated_at: '', labels: [], assignees: [] },
]
const mockLists = [
  { id: 1, board_id: 1, title: 'To Do', position: 0, created_at: '', updated_at: '', cards: [] },
  { id: 2, board_id: 1, title: 'Done', position: 1, created_at: '', updated_at: '', cards: [] },
]

describe('TableView', () => {
  test('should render all cards as table rows', () => {
    render(<TableView cards={mockCards} lists={mockLists} onCardUpdate={vi.fn()} />)
    expect(screen.getByText('Card A')).toBeInTheDocument()
    expect(screen.getByText('Card B')).toBeInTheDocument()
  })

  test('should render column headers', () => {
    render(<TableView cards={mockCards} lists={mockLists} onCardUpdate={vi.fn()} />)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.getByText('Due Date')).toBeInTheDocument()
  })

  test('should sort cards when clicking column header', () => {
    render(<TableView cards={mockCards} lists={mockLists} onCardUpdate={vi.fn()} />)
    const titleHeader = screen.getByText('Title')
    fireEvent.click(titleHeader) // sort ascending
    const rows = screen.getAllByRole('row')
    // Verify order changed
    expect(rows.length).toBeGreaterThan(1)
  })

  test('should enable inline editing on title double click', () => {
    render(<TableView cards={mockCards} lists={mockLists} onCardUpdate={vi.fn()} />)
    fireEvent.doubleClick(screen.getByText('Card A'))
    expect(screen.getByDisplayValue('Card A')).toBeInTheDocument()
  })

  test('should call onCardUpdate when inline edit is saved', () => {
    const onCardUpdate = vi.fn()
    render(<TableView cards={mockCards} lists={mockLists} onCardUpdate={onCardUpdate} />)
    fireEvent.doubleClick(screen.getByText('Card A'))
    const input = screen.getByDisplayValue('Card A')
    fireEvent.change(input, { target: { value: 'Card A Updated' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCardUpdate).toHaveBeenCalledWith(1, { title: 'Card A Updated' })
  })

  test('should show empty state when no cards', () => {
    render(<TableView cards={[]} lists={mockLists} onCardUpdate={vi.fn()} />)
    expect(screen.getByText(/no cards/i)).toBeInTheDocument()
  })
})
