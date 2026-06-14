import { create } from 'zustand'
import { api } from '../lib/api'
import type { Board, Card, Label, List, Workspace } from '../lib/types'

interface BoardState {
  boards: Board[]
  workspaces: Workspace[]
  labels: Label[]
  activeWorkspace: Workspace | null
  activeBoard: Board | null
  isLoading: boolean
  error: string | null

  fetchWorkspaces: () => Promise<void>
  selectWorkspace: (workspace: Workspace | null) => void
  createWorkspace: (name: string) => Promise<void>
  fetchBoards: () => Promise<void>
  fetchBoard: (id: number) => Promise<void>
  createBoard: (title: string, workspaceId?: number, visibility?: string) => Promise<void>
  updateBoardVisibility: (boardId: number, visibility: string) => Promise<void>
  createList: (boardId: number, title: string) => Promise<void>
  createCard: (listId: number, title: string) => Promise<void>
  updateCard: (cardId: number, data: Partial<Card>) => Promise<void>
  deleteCard: (cardId: number) => Promise<void>
  deleteList: (listId: number) => Promise<void>
  fetchLabels: (boardId: number) => Promise<void>
  createLabel: (boardId: number, name: string, color: string) => Promise<void>
  deleteLabel: (id: number) => Promise<void>
  addLabelToCard: (cardId: number, label: Label) => Promise<void>
  removeLabelFromCard: (cardId: number, labelId: number) => Promise<void>
  moveCard: (
    cardId: number,
    sourceListId: number,
    targetListId: number,
    targetIndex: number,
  ) => Promise<void>
  archiveCard: (cardId: number) => Promise<void>
  restoreCard: (cardId: number) => Promise<void>
  archiveList: (listId: number) => Promise<void>
  restoreList: (listId: number) => Promise<void>
  deleteBoard: (boardId: number) => Promise<void>
  restoreBoard: (boardId: number) => Promise<void>
  deleteCardPermanently: (cardId: number) => Promise<void>
  deleteListPermanently: (listId: number) => Promise<void>
  deleteBoardPermanently: (boardId: number) => Promise<void>
  fetchArchive: (boardId: number) => Promise<{ lists: List[]; cards: Card[] }>
  fetchTrash: (boardId: number) => Promise<{ lists: List[]; cards: Card[] }>
  boardMembers: any[]
  userRole: string | null
  fetchBoardMembers: (boardId: number) => Promise<void>
  fetchUserRole: (boardId: number) => Promise<void>
  inviteBoardMember: (boardId: number, email: string, role: string) => Promise<void>
  toggleStarBoard: (boardId: number) => Promise<void>
  activeCardId: number | null
  setActiveCardId: (id: number | null) => void
  addListLocally: (list: List) => void
  updateListLocally: (list: List) => void
  removeListLocally: (listId: number) => void
  addCardLocally: (card: Card) => void
  updateCardLocally: (card: Card) => void
  removeCardLocally: (cardId: number) => void
  moveCardLocally: (payload: { id: number; from_list_id: number; to_list_id: number; position: number }) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  workspaces: [],
  labels: [],
  activeWorkspace: null,
  activeBoard: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ data: Workspace[] }>('/workspaces')
      set({ workspaces: data, isLoading: false })
      if (data.length > 0 && !get().activeWorkspace) {
        set({ activeWorkspace: data[0] })
      }
    } catch {
      const mockWorkspaces = [
        {
          id: 1,
          name: 'Engineering Workspace',
          owner_id: 1,
          created_at: '',
          updated_at: '',
        },
        { id: 2, name: 'Design Workspace', owner_id: 2, created_at: '', updated_at: '' },
      ]
      set({ workspaces: mockWorkspaces, activeWorkspace: mockWorkspaces[0], isLoading: false })
    }
  },

  selectWorkspace: (workspace) => {
    set({ activeWorkspace: workspace, activeBoard: null })
  },

  createWorkspace: async (name: string) => {
    try {
      const { data } = await api.post<{ data: Workspace }>('/workspaces', { name })
      set((state) => ({ workspaces: [...state.workspaces, data], activeWorkspace: data }))
    } catch {
      const mockWS: Workspace = {
        id: Math.floor(Math.random() * 1000) + 10,
        name,
        owner_id: 1,
        created_at: '',
        updated_at: '',
      }
      set((state) => ({ workspaces: [...state.workspaces, mockWS], activeWorkspace: mockWS }))
    }
  },

  fetchBoards: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ data: Board[] }>('/boards')
      set({ boards: data, isLoading: false })
    } catch {
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
        {
          id: 3,
          workspace_id: 2,
          title: 'Website Redesign',
          visibility: 'workspace-only',
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
      get().fetchBoardMembers(id).catch(console.error)
      get().fetchUserRole(id).catch(console.error)
    } catch {
      const mockBoard: Board = {
        id,
        workspace_id: id === 3 ? 2 : 1,
        title: id === 1 ? 'Flux Development' : id === 2 ? 'Sprint Planning' : 'Website Redesign',
        visibility: id === 1 ? 'public' : id === 2 ? 'private' : 'workspace-only',
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
                due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
                created_at: '',
                updated_at: '',
                labels: [{ id: 50, board_id: id, name: 'Feature', color: '#3b82f6' }],
              },
              {
                id: 101,
                list_id: 10,
                title: 'Integrate Rich Text Editor',
                description: 'Setup TipTap editor in Card Details modal',
                position: 1,
                story_points: 5,
                due_date: new Date(Date.now() - 86400000).toISOString(),
                created_at: '',
                updated_at: '',
                labels: [{ id: 51, board_id: id, name: 'Urgent', color: '#ef4444' }],
              },
            ],
          },
        ],
      }
      set({ activeBoard: mockBoard, isLoading: false })
    }
  },

  createBoard: async (title: string, workspaceId?: number, visibility?: string) => {
    const wsId = workspaceId || get().activeWorkspace?.id || 1
    const vis = visibility || 'private'
    try {
      const { data } = await api.post<{ data: Board }>('/boards', {
        title,
        workspace_id: wsId,
        visibility: vis,
      })
      set((state) => ({ boards: [data, ...state.boards] }))
    } catch {
      const mockNew: Board = {
        id: Math.floor(Math.random() * 1000) + 10,
        workspace_id: wsId,
        title,
        visibility: vis,
        created_at: '',
        updated_at: '',
      }
      set((state) => ({ boards: [mockNew, ...state.boards] }))
    }
  },

  updateBoardVisibility: async (boardId: number, visibility: string) => {
    try {
      const { data } = await api.put<{ data: Board }>(`/boards/${boardId}`, { visibility })
      set((state) => {
        const updatedBoards = state.boards.map((b) => (b.id === boardId ? data : b))
        const updatedActive =
          state.activeBoard?.id === boardId
            ? { ...state.activeBoard, visibility }
            : state.activeBoard
        return { boards: updatedBoards, activeBoard: updatedActive }
      })
    } catch {
      set((state) => {
        const updatedBoards = state.boards.map((b) => (b.id === boardId ? { ...b, visibility } : b))
        const updatedActive =
          state.activeBoard?.id === boardId
            ? { ...state.activeBoard, visibility }
            : state.activeBoard
        return { boards: updatedBoards, activeBoard: updatedActive }
      })
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
              cards: [...(list.cards || []), { ...data, labels: [] }],
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
      const mockCard: Card = {
        id: Math.floor(Math.random() * 1000) + 1000,
        list_id: listId,
        title,
        position: 99,
        created_at: '',
        updated_at: '',
        labels: [],
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
              ? list.cards.map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c))
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

  fetchLabels: async (boardId: number) => {
    try {
      const { data } = await api.get<{ data: Label[] }>(`/labels?boardId=${boardId}`)
      set({ labels: data })
    } catch {
      const mockLabels = [
        { id: 50, board_id: boardId, name: 'Feature', color: '#3b82f6' },
        { id: 51, board_id: boardId, name: 'Urgent', color: '#ef4444' },
        { id: 52, board_id: boardId, name: 'Bug', color: '#ef4444' },
        { id: 53, board_id: boardId, name: 'Refactor', color: '#10b981' },
      ]
      set({ labels: mockLabels })
    }
  },

  createLabel: async (boardId: number, name: string, color: string) => {
    try {
      const { data } = await api.post<{ data: Label }>('/labels', {
        board_id: boardId,
        name,
        color,
      })
      set((state) => ({ labels: [...state.labels, data] }))
    } catch {
      const mockLabel: Label = {
        id: Math.floor(Math.random() * 1000) + 200,
        board_id: boardId,
        name,
        color,
      }
      set((state) => ({ labels: [...state.labels, mockLabel] }))
    }
  },

  deleteLabel: async (id: number) => {
    try {
      await api.delete(`/labels/${id}`)
      set((state) => ({ labels: state.labels.filter((l) => l.id !== id) }))
    } catch {
      set((state) => ({ labels: state.labels.filter((l) => l.id !== id) }))
    }
  },

  addLabelToCard: async (cardId: number, label: Label) => {
    try {
      await api.post(`/labels/card/${cardId}`, { label_id: label.id })
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.map((c) => {
            if (c.id === cardId) {
              const currentLabels = c.labels || []
              if (currentLabels.some((l) => l.id === label.id)) return c
              return { ...c, labels: [...currentLabels, label] }
            }
            return c
          }),
        }))
        return { activeBoard: { ...state.activeBoard, lists: updatedLists } }
      })
    } catch {
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.map((c) => {
            if (c.id === cardId) {
              const currentLabels = c.labels || []
              if (currentLabels.some((l) => l.id === label.id)) return c
              return { ...c, labels: [...currentLabels, label] }
            }
            return c
          }),
        }))
        return { activeBoard: { ...state.activeBoard, lists: updatedLists } }
      })
    }
  },

  removeLabelFromCard: async (cardId: number, labelId: number) => {
    try {
      await api.delete(`/labels/card/${cardId}/${labelId}`)
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.map((c) => {
            if (c.id === cardId) {
              const currentLabels = c.labels || []
              return { ...c, labels: currentLabels.filter((l) => l.id !== labelId) }
            }
            return c
          }),
        }))
        return { activeBoard: { ...state.activeBoard, lists: updatedLists } }
      })
    } catch {
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.map((c) => {
            if (c.id === cardId) {
              const currentLabels = c.labels || []
              return { ...c, labels: currentLabels.filter((l) => l.id !== labelId) }
            }
            return c
          }),
        }))
        return { activeBoard: { ...state.activeBoard, lists: updatedLists } }
      })
    }
  },

  moveCard: async (
    cardId: number,
    sourceListId: number,
    targetListId: number,
    targetIndex: number,
  ) => {
    const activeBoard = get().activeBoard
    if (!activeBoard?.lists) return

    // Find the card being moved
    let movedCard: Card | null = null
    for (const list of activeBoard.lists) {
      const card = list.cards?.find((c) => c.id === cardId)
      if (card) {
        movedCard = { ...card, list_id: targetListId }
        break
      }
    }
    if (!movedCard) return

    // Create a copy of lists and cards
    const updatedLists = activeBoard.lists.map((list) => {
      let cards = [...(list.cards || [])]
      if (list.id === sourceListId) {
        cards = cards.filter((c) => c.id !== cardId)
      }
      if (list.id === targetListId) {
        if (sourceListId === targetListId) {
          cards = cards.filter((c) => c.id !== cardId)
        }
        cards.splice(targetIndex, 0, movedCard!)
      }
      // Re-assign positions
      const updatedCards = cards.map((c, idx) => ({
        ...c,
        position: idx,
      }))
      return {
        ...list,
        cards: updatedCards,
      }
    })

    // Optimistic state update
    set({
      activeBoard: {
        ...activeBoard,
        lists: updatedLists,
      },
    })

    // Persist changes
    try {
      const cardsToUpdate: { id: number; list_id: number; position: number }[] = []
      const sourceList = updatedLists.find((l) => l.id === sourceListId)
      const targetList = updatedLists.find((l) => l.id === targetListId)

      if (sourceList?.cards) {
        for (const c of sourceList.cards) {
          cardsToUpdate.push({ id: c.id, list_id: sourceListId, position: c.position })
        }
      }
      if (targetList && targetListId !== sourceListId && targetList.cards) {
        for (const c of targetList.cards) {
          cardsToUpdate.push({ id: c.id, list_id: targetListId, position: c.position })
        }
      }

      await api.put('/cards/positions', { cards: cardsToUpdate })
    } catch (error) {
      console.error('Failed to update card positions:', error)
      if (activeBoard.id) {
        await get().fetchBoard(activeBoard.id)
      }
    }
  },

  archiveCard: async (cardId: number) => {
    try {
      await api.put(`/cards/${cardId}`, { archived_at: new Date().toISOString() })
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.map((list) => ({
          ...list,
          cards: list.cards.filter((c) => c.id !== cardId),
        }))
        return { activeBoard: { ...state.activeBoard, lists: updatedLists } }
      })
    } catch (err) {
      console.error('Failed to archive card:', err)
    }
  },

  restoreCard: async (cardId: number) => {
    try {
      await api.put(`/cards/${cardId}`, { archived_at: null, deleted_at: null })
      if (get().activeBoard?.id) {
        await get().fetchBoard(get().activeBoard!.id)
      }
    } catch (err) {
      console.error('Failed to restore card:', err)
    }
  },

  archiveList: async (listId: number) => {
    try {
      await api.put(`/lists/${listId}`, { archived_at: new Date().toISOString() })
      set((state) => {
        if (!state.activeBoard?.lists) return {}
        const updatedLists = state.activeBoard.lists.filter((l) => l.id !== listId)
        return { activeBoard: { ...state.activeBoard, lists: updatedLists } }
      })
    } catch (err) {
      console.error('Failed to archive list:', err)
    }
  },

  restoreList: async (listId: number) => {
    try {
      await api.put(`/lists/${listId}`, { archived_at: null, deleted_at: null })
      if (get().activeBoard?.id) {
        await get().fetchBoard(get().activeBoard!.id)
      }
    } catch (err) {
      console.error('Failed to restore list:', err)
    }
  },

  deleteBoard: async (boardId: number) => {
    try {
      await api.delete(`/boards/${boardId}`)
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        activeBoard: state.activeBoard?.id === boardId ? null : state.activeBoard,
      }))
    } catch (err) {
      console.error('Failed to delete board:', err)
    }
  },

  restoreBoard: async (boardId: number) => {
    try {
      await api.put(`/boards/${boardId}`, { deleted_at: null, archived_at: null })
      await get().fetchBoards()
    } catch (err) {
      console.error('Failed to restore board:', err)
    }
  },

  deleteCardPermanently: async (cardId: number) => {
    try {
      await api.delete(`/cards/${cardId}?permanent=true`)
    } catch (err) {
      console.error('Failed to delete card permanently:', err)
    }
  },

  deleteListPermanently: async (listId: number) => {
    try {
      await api.delete(`/lists/${listId}?permanent=true`)
    } catch (err) {
      console.error('Failed to delete list permanently:', err)
    }
  },

  deleteBoardPermanently: async (boardId: number) => {
    try {
      await api.delete(`/boards/${boardId}?permanent=true`)
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        activeBoard: state.activeBoard?.id === boardId ? null : state.activeBoard,
      }))
    } catch (err) {
      console.error('Failed to delete board permanently:', err)
    }
  },

  fetchArchive: async (boardId: number) => {
    try {
      const res = await api.get<{ data: { lists: List[]; cards: Card[] } }>(
        `/boards/${boardId}/archive`,
      )
      return res.data
    } catch {
      return { lists: [], cards: [] }
    }
  },

  fetchTrash: async (boardId: number) => {
    try {
      const res = await api.get<{ data: { lists: List[]; cards: Card[] } }>(
        `/boards/${boardId}/trash`,
      )
      return res.data
    } catch {
      return { lists: [], cards: [] }
    }
  },

  boardMembers: [],
  userRole: null,

  fetchBoardMembers: async (boardId: number) => {
    try {
      const res = await api.get<any[]>(`/boards/${boardId}/members`)
      set({ boardMembers: res })
    } catch (err) {
      console.error(err)
      set({ boardMembers: [] })
    }
  },

  fetchUserRole: async (boardId: number) => {
    try {
      const res = await api.get<{ role: string | null }>(`/boards/${boardId}/role`)
      set({ userRole: res.role })
    } catch (err) {
      console.error(err)
      set({ userRole: null })
    }
  },

  inviteBoardMember: async (boardId: number, email: string, role: string) => {
    try {
      await api.post(`/boards/${boardId}/members`, { email, role })
      await get().fetchBoardMembers(boardId)
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  toggleStarBoard: async (boardId: number) => {
    const boards = get().boards
    const board = boards.find((b) => b.id === boardId)
    if (!board) return

    const isStarredNow = !board.is_starred

    // Optimistic update
    set((state) => {
      const updatedBoards = state.boards.map((b) =>
        b.id === boardId ? { ...b, is_starred: isStarredNow } : b
      )
      const updatedActive =
        state.activeBoard?.id === boardId
          ? { ...state.activeBoard, is_starred: isStarredNow }
          : state.activeBoard
      return { boards: updatedBoards, activeBoard: updatedActive }
    })

    try {
      if (isStarredNow) {
        await api.post(`/boards/${boardId}/star`, {})
      } else {
        await api.delete(`/boards/${boardId}/star`)
      }
    } catch (err) {
      console.error(err)
      // Rollback on failure
      set((state) => {
        const updatedBoards = state.boards.map((b) =>
          b.id === boardId ? { ...b, is_starred: !isStarredNow } : b
        )
        const updatedActive =
          state.activeBoard?.id === boardId
            ? { ...state.activeBoard, is_starred: !isStarredNow }
            : state.activeBoard
        return { boards: updatedBoards, activeBoard: updatedActive }
      })
    }
  },

  activeCardId: null,
  setActiveCardId: (id: number | null) => set({ activeCardId: id }),

  addListLocally: (list: List) => set((state) => {
    if (!state.activeBoard || state.activeBoard.id !== list.board_id) return {}
    const lists = state.activeBoard.lists || []
    if (lists.some((l) => l.id === list.id)) return {}
    return {
      activeBoard: {
        ...state.activeBoard,
        lists: [...lists, { ...list, cards: [] }].sort((a, b) => a.position - b.position),
      }
    }
  }),

  updateListLocally: (list: List) => set((state) => {
    if (!state.activeBoard) return {}
    const lists = state.activeBoard.lists || []
    return {
      activeBoard: {
        ...state.activeBoard,
        lists: lists.map((l) => l.id === list.id ? { ...l, ...list } : l).sort((a, b) => a.position - b.position),
      }
    }
  }),

  removeListLocally: (listId: number) => set((state) => {
    if (!state.activeBoard) return {}
    const lists = state.activeBoard.lists || []
    return {
      activeBoard: {
        ...state.activeBoard,
        lists: lists.filter((l) => l.id !== listId),
      }
    }
  }),

  addCardLocally: (card: Card) => set((state) => {
    if (!state.activeBoard) return {}
    const lists = state.activeBoard.lists || []
    const updatedLists = lists.map((list) => {
      if (list.id !== card.list_id) return list
      const cards = list.cards || []
      if (cards.some((c) => c.id === card.id)) return list
      return {
        ...list,
        cards: [...cards, card].sort((a, b) => a.position - b.position),
      }
    })
    return {
      activeBoard: {
        ...state.activeBoard,
        lists: updatedLists,
      }
    }
  }),

  updateCardLocally: (card: Card) => set((state) => {
    if (!state.activeBoard) return {}
    const lists = state.activeBoard.lists || []
    const isRemoved = !!card.deleted_at || !!card.archived_at

    const updatedLists = lists.map((list) => {
      const cards = list.cards || []
      if (isRemoved) {
        return {
          ...list,
          cards: cards.filter((c) => c.id !== card.id),
        }
      }
      const hasCard = cards.some((c) => c.id === card.id)
      if (hasCard) {
        if (list.id !== card.list_id) {
          return {
            ...list,
            cards: cards.filter((c) => c.id !== card.id),
          }
        }
        return {
          ...list,
          cards: cards.map((c) => c.id === card.id ? { ...c, ...card } : c).sort((a, b) => a.position - b.position),
        }
      }
      if (list.id === card.list_id) {
        return {
          ...list,
          cards: [...cards, card].sort((a, b) => a.position - b.position),
        }
      }
      return list
    })
    return {
      activeBoard: {
        ...state.activeBoard,
        lists: updatedLists,
      }
    }
  }),

  removeCardLocally: (cardId: number) => set((state) => {
    if (!state.activeBoard) return {}
    const lists = state.activeBoard.lists || []
    const updatedLists = lists.map((list) => ({
      ...list,
      cards: (list.cards || []).filter((c) => c.id !== cardId),
    }))
    return {
      activeBoard: {
        ...state.activeBoard,
        lists: updatedLists,
      }
    }
  }),

  moveCardLocally: (payload: { id: number; from_list_id: number; to_list_id: number; position: number }) => set((state) => {
    if (!state.activeBoard?.lists) return {}
    const { id, from_list_id, to_list_id, position } = payload

    let movedCard: Card | null = null
    for (const list of state.activeBoard.lists) {
      const card = list.cards?.find((c) => c.id === id)
      if (card) {
        movedCard = { ...card, list_id: to_list_id }
        break
      }
    }
    if (!movedCard) return {}

    const updatedLists = state.activeBoard.lists.map((list) => {
      let cards = [...(list.cards || [])]
      if (list.id === from_list_id) {
        cards = cards.filter((c) => c.id !== id)
      }
      if (list.id === to_list_id) {
        if (from_list_id === to_list_id) {
          cards = cards.filter((c) => c.id !== id)
        }
        cards.splice(position, 0, movedCard!)
      }
      return {
        ...list,
        cards: cards.map((c, idx) => ({ ...c, position: idx })),
      }
    })

    return {
      activeBoard: {
        ...state.activeBoard,
        lists: updatedLists,
      }
    }
  }),
}))

