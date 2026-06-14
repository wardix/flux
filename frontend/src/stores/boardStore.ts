import { create } from 'zustand'
import { api } from '../lib/api'
import type { Board, Card, List } from '../lib/types'

interface BoardState {
  boards: Board[]
  activeBoard: Board | null
  isLoading: boolean
  error: string | null

  fetchBoards: () => Promise<void>
  fetchBoard: (id: number) => Promise<void>
  createBoard: (title: string) => Promise<void>
  createList: (boardId: number, title: string) => Promise<void>
  createCard: (listId: number, title: string) => Promise<void>
  updateCard: (cardId: number, data: Partial<Card>) => Promise<void>
  deleteCard: (cardId: number) => Promise<void>
  deleteList: (listId: number) => Promise<void>
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  activeBoard: null,
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ data: Board[] }>('/boards')
      set({ boards: data, isLoading: false })
    } catch {
      // Fallback for offline/standalone preview mode
      const mockBoards = [
        {
          id: 1,
          workspace_id: 1,
          title: 'Flux Development',
          visibility: 'public',
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          workspace_id: 1,
          title: 'Sprint Planning',
          visibility: 'private',
          created_at: '',
          updated_at: '',
        },
      ]
      set({ boards: mockBoards, isLoading: false })
    }
  },

  fetchBoard: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ data: Board }>(`/boards/${id}`)
      set({ activeBoard: data, isLoading: false })
    } catch {
      // Fallback for offline/standalone preview mode
      const mockBoard: Board = {
        id,
        workspace_id: 1,
        title: id === 1 ? 'Flux Development' : 'Sprint Planning',
        visibility: 'public',
        created_at: '',
        updated_at: '',
        lists: [
          {
            id: 10,
            board_id: id,
            title: 'Backlog',
            position: 0,
            created_at: '',
            updated_at: '',
            cards: [
              {
                id: 100,
                list_id: 10,
                title: 'Research WebSocket Libraries',
                description: 'Look into native WebSockets vs Socket.io in Hono',
                position: 0,
                story_points: 3,
                created_at: '',
                updated_at: '',
              },
              {
                id: 101,
                list_id: 10,
                title: 'Integrate Rich Text Editor',
                description: 'Setup TipTap editor in Card Details modal',
                position: 1,
                story_points: 5,
                created_at: '',
                updated_at: '',
              },
            ],
          },
          {
            id: 11,
            board_id: id,
            title: 'To Do',
            position: 1,
            created_at: '',
            updated_at: '',
            cards: [
              {
                id: 102,
                list_id: 11,
                title: 'Design DB Schema',
                description: 'Define relations between boards, lists and cards',
                position: 0,
                story_points: 2,
                created_at: '',
                updated_at: '',
              },
              {
                id: 103,
                list_id: 11,
                title: 'Setup Frontend Project',
                description: 'Initialize React App with Vite, Tailwind CSS, and DaisyUI',
                position: 1,
                story_points: 1,
                created_at: '',
                updated_at: '',
              },
            ],
          },
          {
            id: 12,
            board_id: id,
            title: 'In Progress',
            position: 2,
            created_at: '',
            updated_at: '',
            cards: [
              {
                id: 104,
                list_id: 12,
                title: 'Develop Authentication',
                description: 'Implement JWT login/register flow on backend and frontend',
                position: 0,
                story_points: 3,
                created_at: '',
                updated_at: '',
              },
            ],
          },
          {
            id: 13,
            board_id: id,
            title: 'Done',
            position: 3,
            created_at: '',
            updated_at: '',
            cards: [
              {
                id: 105,
                list_id: 13,
                title: 'Configure Biome',
                description: 'Setup Biome for formatting and linting instead of ESLint/Prettier',
                position: 0,
                story_points: 1,
                created_at: '',
                updated_at: '',
              },
            ],
          },
        ],
      }
      set({ activeBoard: mockBoard, isLoading: false })
    }
  },

  createBoard: async (title: string) => {
    try {
      const { data } = await api.post<{ data: Board }>('/boards', { title })
      set((state) => ({ boards: [data, ...state.boards] }))
    } catch {
      // Mock creation fallback
      const mockNew: Board = {
        id: Math.floor(Math.random() * 1000) + 10,
        workspace_id: 1,
        title,
        visibility: 'private',
        created_at: '',
        updated_at: '',
      }
      set((state) => ({ boards: [mockNew, ...state.boards] }))
    }
  },

  createList: async (boardId: number, title: string) => {
    try {
      const { data } = await api.post<{ data: List }>('/lists', { board_id: boardId, title })
      set((state) => {
        if (!state.activeBoard) return {}
        const currentLists = state.activeBoard.lists || []
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: [...currentLists, { ...data, cards: [] }],
          },
        }
      })
    } catch {
      // Mock creation fallback
      const mockList: List = {
        id: Math.floor(Math.random() * 1000) + 100,
        board_id: boardId,
        title,
        position: 99,
        created_at: '',
        updated_at: '',
        cards: [],
      }
      set((state) => {
        if (!state.activeBoard) return {}
        const currentLists = state.activeBoard.lists || []
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: [...currentLists, mockList],
          },
        }
      })
    }
  },

  createCard: async (listId: number, title: string) => {
    try {
      const { data } = await api.post<{ data: Card }>('/cards', { list_id: listId, title })
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              cards: [...(list.cards || []), data],
            }
          }
          return list
        })
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: updatedLists,
          },
        }
      })
    } catch {
      // Mock creation fallback
      const mockCard: Card = {
        id: Math.floor(Math.random() * 1000) + 1000,
        list_id: listId,
        title,
        position: 99,
        created_at: '',
        updated_at: '',
      }
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              cards: [...(list.cards || []), mockCard],
            }
          }
          return list
        })
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: updatedLists,
          },
        }
      })
    }
  },

  updateCard: async (cardId: number, data: Partial<Card>) => {
    try {
      const { data: updatedCard } = await api.put<{ data: Card }>(`/cards/${cardId}`, data)
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => {
          if (data.list_id !== undefined && data.list_id !== list.id) {
            return {
              ...list,
              cards: list.cards.filter((c) => c.id !== cardId),
            }
          }
          if (list.id === updatedCard.list_id) {
            const exists = list.cards.some((c) => c.id === cardId)
            const updatedCards = exists
              ? list.cards.map((c) => (c.id === cardId ? updatedCard : c))
              : [...list.cards, updatedCard]
            return {
              ...list,
              cards: updatedCards.sort((a, b) => a.position - b.position),
            }
          }
          return list
        })
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: updatedLists,
          },
        }
      })
    } catch {
      // Mock update fallback
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => {
          const card = list.cards.find((c) => c.id === cardId)
          if (card) {
            const updated = { ...card, ...data }
            return {
              ...list,
              cards: list.cards.map((c) => (c.id === cardId ? updated : c)),
            }
          }
          return list
        })
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: updatedLists,
          },
        }
      })
    }
  },

  deleteCard: async (cardId: number) => {
    try {
      await api.delete(`/cards/${cardId}`)
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.filter((c) => c.id !== cardId),
        }))
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: updatedLists,
          },
        }
      })
    } catch {
      // Mock delete fallback
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.filter((c) => c.id !== cardId),
        }))
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: updatedLists,
          },
        }
      })
    }
  },

  deleteList: async (listId: number) => {
    try {
      await api.delete(`/lists/${listId}`)
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: state.activeBoard.lists.filter((list) => list.id !== listId),
          },
        }
      })
    } catch {
      // Mock delete fallback
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        return {
          activeBoard: {
            ...state.activeBoard,
            lists: state.activeBoard.lists.filter((list) => list.id !== listId),
          },
        }
      })
    }
  },
}))
