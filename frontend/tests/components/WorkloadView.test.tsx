import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkloadBar } from '../../src/components/board/WorkloadBar'
import { WorkloadView } from '../../src/components/board/WorkloadView'

const mockMembers = [
  {
    id: 1,
    name: 'John Doe',
    avatar_url: null,
    total_cards: 12,
    active_cards: 8,
    completed_cards: 4,
    overdue_cards: 2,
    capacity_level: 'optimal' as const,
  },
  {
    id: 2,
    name: 'Jane Smith',
    avatar_url: null,
    total_cards: 15,
    active_cards: 13,
    completed_cards: 2,
    overdue_cards: 5,
    capacity_level: 'overload' as const,
  },
  {
    id: 3,
    name: 'Bob Wilson',
    avatar_url: null,
    total_cards: 3,
    active_cards: 2,
    completed_cards: 1,
    overdue_cards: 0,
    capacity_level: 'underload' as const,
  },
]

describe('WorkloadBar', () => {
  test('should render member name and card count', () => {
    render(
      <WorkloadBar
        member={mockMembers[0]}
        isExpanded={false}
        onToggle={vi.fn()}
        onCardClick={vi.fn()}
      />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument() // active cards
  })

  test('should apply correct color for underload', () => {
    const { container } = render(
      <WorkloadBar
        member={mockMembers[2]}
        isExpanded={false}
        onToggle={vi.fn()}
        onCardClick={vi.fn()}
      />
    )
    // Verify green/success color is applied
    expect(container.querySelector('[class*="success"]')).not.toBeNull()
  })

  test('should apply correct color for overload', () => {
    const { container } = render(
      <WorkloadBar
        member={mockMembers[1]}
        isExpanded={false}
        onToggle={vi.fn()}
        onCardClick={vi.fn()}
      />
    )
    // Verify red/error color is applied
    expect(container.querySelector('[class*="error"]')).not.toBeNull()
  })

  test('should call onToggle when bar is clicked', () => {
    const onToggle = vi.fn()
    render(
      <WorkloadBar
        member={mockMembers[0]}
        isExpanded={false}
        onToggle={onToggle}
        onCardClick={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('John Doe'))
    expect(onToggle).toHaveBeenCalled()
  })

  test('should show overdue badge when member has overdue cards', () => {
    render(
      <WorkloadBar
        member={mockMembers[1]}
        isExpanded={false}
        onToggle={vi.fn()}
        onCardClick={vi.fn()}
      />
    )
    expect(screen.getByText(/overdue/i)).toBeInTheDocument()
  })
})

describe('WorkloadView', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: [] }),
      })
    ) as any
  })

  test('should render capacity legend', async () => {
    // Mock fetch and render WorkloadView
    render(<WorkloadView boardId={1} />)
    expect(await screen.findByText(/available/i)).toBeInTheDocument()
    expect(screen.getByText(/balanced/i)).toBeInTheDocument()
    expect(screen.getByText(/overloaded/i)).toBeInTheDocument()
  })
})
