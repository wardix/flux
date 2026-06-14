import { useEffect } from 'react'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut'
import { useBoardStore } from '../../stores/boardStore'
import { useAuthStore } from '../../stores/authStore'

export function BoardShortcuts() {
  const { activeBoard, updateCard, deleteCard } = useBoardStore()
  const { user } = useAuthStore()

  // Helper to get currently focused card ID
  const getFocusedCardId = () => {
    const activeEl = document.activeElement
    if (activeEl?.getAttribute('role') === 'option') {
      const cardId = activeEl.getAttribute('data-card-id')
      return cardId ? parseInt(cardId, 10) : null
    }
    return null
  }

  // Helper to get all card elements
  const getCardElements = () => {
    return Array.from(document.querySelectorAll('[role="option"][data-card-id]')) as HTMLElement[]
  }

  useKeyboardShortcut('c', (e) => {
    e.preventDefault()
    // Open create card form on first list
    if (!activeBoard?.lists?.length) return
    const firstListId = activeBoard.lists[0].id
    // This is hacky, but simulates clicking "Add Card" on the first list
    const btn = document.querySelector(`[data-list-add-card="${firstListId}"]`) as HTMLButtonElement
    if (btn) btn.click()
  }, { description: 'Create new card', category: 'Board' })

  useKeyboardShortcut(' ', (e) => {
    const cardId = getFocusedCardId()
    if (cardId && user) {
      e.preventDefault() // prevent page scroll
      const card = activeBoard?.lists?.flatMap(l => l.cards).find(c => c.id === cardId)
      if (!card) return
      
      const hasAssignee = card.assignees?.some(a => a.id === user.id)
      const newAssignees = hasAssignee 
        ? card.assignees?.filter(a => a.id !== user.id) || []
        : [...(card.assignees || []), { id: user.id, name: user.name, avatar_url: null }]
      
      updateCard(cardId, { assignee_ids: newAssignees.map(a => a.id) })
    }
  }, { description: 'Assign yourself', category: 'Card' })

  useKeyboardShortcut('Enter', (e) => {
    const cardId = getFocusedCardId()
    if (cardId) {
      e.preventDefault()
      // CardItem's onKeyDown handles it if it's there, but if it doesn't trigger, we can do:
      const activeEl = document.activeElement as HTMLElement
      activeEl.click()
    }
  }, { description: 'Open card detail', category: 'Card' })

  useKeyboardShortcut('Delete', (e) => {
    const cardId = getFocusedCardId()
    if (cardId) {
      e.preventDefault()
      if (confirm('Are you sure you want to delete this card?')) {
        deleteCard(cardId)
      }
    }
  }, { description: 'Archive card', category: 'Card' })

  useKeyboardShortcut('l', (e) => {
    const cardId = getFocusedCardId()
    if (cardId) {
      e.preventDefault()
      // Simulate click on labels button in detail if open, or just trigger label picker
      // For now just open card
      const activeEl = document.activeElement as HTMLElement
      activeEl.click()
    }
  }, { description: 'Open label picker', category: 'Card' })

  useKeyboardShortcut('d', (e) => {
    const cardId = getFocusedCardId()
    if (cardId) {
      e.preventDefault()
      const activeEl = document.activeElement as HTMLElement
      activeEl.click()
    }
  }, { description: 'Open date picker', category: 'Card' })

  useKeyboardShortcut('a', (e) => {
    const cardId = getFocusedCardId()
    if (cardId) {
      e.preventDefault()
      const activeEl = document.activeElement as HTMLElement
      activeEl.click()
    }
  }, { description: 'Open member picker', category: 'Card' })

  useKeyboardShortcut('ArrowDown', (e) => {
    const activeEl = document.activeElement
    if (!activeEl || activeEl.getAttribute('role') !== 'option') return
    e.preventDefault()
    const cards = getCardElements()
    const idx = cards.indexOf(activeEl as HTMLElement)
    if (idx >= 0 && idx < cards.length - 1) {
      cards[idx + 1].focus()
    }
  }, { description: 'Focus next card', category: 'Navigation' })

  useKeyboardShortcut('ArrowUp', (e) => {
    const activeEl = document.activeElement
    if (!activeEl || activeEl.getAttribute('role') !== 'option') return
    e.preventDefault()
    const cards = getCardElements()
    const idx = cards.indexOf(activeEl as HTMLElement)
    if (idx > 0) {
      cards[idx - 1].focus()
    }
  }, { description: 'Focus previous card', category: 'Navigation' })

  useKeyboardShortcut('ArrowRight', (e) => {
    const activeEl = document.activeElement
    if (!activeEl || activeEl.getAttribute('role') !== 'option') return
    e.preventDefault()
    // Find next list
    // This is an approximation
    const cards = getCardElements()
    const idx = cards.indexOf(activeEl as HTMLElement)
    const currentListId = activeEl.closest('[role="listbox"]')?.parentElement?.getAttribute('data-list-id')
    
    // find first card in next list
    const lists = Array.from(document.querySelectorAll('[data-list-id]'))
    const listIdx = lists.findIndex(l => l.getAttribute('data-list-id') === currentListId)
    if (listIdx >= 0 && listIdx < lists.length - 1) {
      const nextList = lists[listIdx + 1]
      const nextCard = nextList.querySelector('[role="option"]') as HTMLElement
      if (nextCard) nextCard.focus()
    }
  }, { description: 'Focus card in next list', category: 'Navigation' })

  useKeyboardShortcut('ArrowLeft', (e) => {
    const activeEl = document.activeElement
    if (!activeEl || activeEl.getAttribute('role') !== 'option') return
    e.preventDefault()
    const currentListId = activeEl.closest('[role="listbox"]')?.parentElement?.getAttribute('data-list-id')
    
    const lists = Array.from(document.querySelectorAll('[data-list-id]'))
    const listIdx = lists.findIndex(l => l.getAttribute('data-list-id') === currentListId)
    if (listIdx > 0) {
      const prevList = lists[listIdx - 1]
      const prevCard = prevList.querySelector('[role="option"]') as HTMLElement
      if (prevCard) prevCard.focus()
    }
  }, { description: 'Focus card in previous list', category: 'Navigation' })

  return null
}
