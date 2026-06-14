import { beforeEach, describe, expect, test, vi } from 'vitest'
import { api } from '../../src/lib/api'
import { useBoardStore } from '../../src/stores/boardStore'

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({
      boards: [],
      workspaces: [],
      activeWorkspace: null,
      activeBoard: null,
      error: null,
      isLoading: false,
    })
  })

  test('should initialize with default state', () => {
    const state = useBoardStore.getState()
    expect(state.boards).toEqual([])
    expect(state.workspaces).toEqual([])
    expect(state.activeBoard).toBeNull()
  })

  test('should fetch workspaces and set activeWorkspace fallback', async () => {
    await useBoardStore.getState().fetchWorkspaces()
    const state = useBoardStore.getState()
    expect(state.workspaces.length).toBeGreaterThan(0)
    expect(state.activeWorkspace).toBeDefined()
    expect(state.activeWorkspace?.name).toBe('Engineering Workspace')
  })

  test('should create workspace fallback', async () => {
    await useBoardStore.getState().createWorkspace('Product Team')
    const state = useBoardStore.getState()
    expect(state.workspaces.some((w) => w.name === 'Product Team')).toBe(true)
    expect(state.activeWorkspace?.name).toBe('Product Team')
  })

  test('should update board visibility fallback', async () => {
    useBoardStore.setState({
      boards: [
        {
          id: 1,
          workspace_id: 1,
          title: 'Board',
          visibility: 'private',
          created_at: '',
          updated_at: '',
        },
      ],
      activeBoard: {
        id: 1,
        workspace_id: 1,
        title: 'Board',
        visibility: 'private',
        created_at: '',
        updated_at: '',
      },
    })

    await useBoardStore.getState().updateBoardVisibility(1, 'public')
    const state = useBoardStore.getState()
    expect(state.boards[0].visibility).toBe('public')
    expect(state.activeBoard?.visibility).toBe('public')
  })

  test('should move card between lists and re-assign positions', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: Mocking API response for test spy
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({ success: true } as any)

    useBoardStore.setState({
      activeBoard: {
        id: 1,
        workspace_id: 1,
        title: 'Board',
        visibility: 'private',
        created_at: '',
        updated_at: '',
        lists: [
          {
            id: 10,
            board_id: 1,
            title: 'List 1',
            position: 0,
            created_at: '',
            updated_at: '',
            cards: [
              {
                id: 100,
                list_id: 10,
                title: 'Card 1',
                position: 0,
                created_at: '',
                updated_at: '',
              },
              {
                id: 101,
                list_id: 10,
                title: 'Card 2',
                position: 1,
                created_at: '',
                updated_at: '',
              },
            ],
          },
          {
            id: 11,
            board_id: 1,
            title: 'List 2',
            position: 1,
            created_at: '',
            updated_at: '',
            cards: [],
          },
        ],
      },
    })

    await useBoardStore.getState().moveCard(100, 10, 11, 0)
    const state = useBoardStore.getState()
    const list1 = state.activeBoard?.lists?.find((l) => l.id === 10)
    const list2 = state.activeBoard?.lists?.find((l) => l.id === 11)

    expect(list1?.cards.length).toBe(1)
    expect(list1?.cards[0].id).toBe(101)
    expect(list1?.cards[0].position).toBe(0)

    expect(list2?.cards.length).toBe(1)
    expect(list2?.cards[0].id).toBe(100)
    expect(list2?.cards[0].position).toBe(0)

    expect(putSpy).toHaveBeenCalledWith('/cards/positions', {
      cards: [
        { id: 101, list_id: 10, position: 0 },
        { id: 100, list_id: 11, position: 0 },
      ],
    })
    putSpy.mockRestore()
  })
})
