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

  test('should archive card and remove it from active board locally', async () => {
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
            ],
          },
        ],
      },
    })

    await useBoardStore.getState().archiveCard(100)
    expect(putSpy).toHaveBeenCalledWith(
      '/cards/100',
      expect.objectContaining({ archived_at: expect.any(String) }),
    )

    const state = useBoardStore.getState()
    expect(state.activeBoard?.lists?.[0].cards.length).toBe(0)

    putSpy.mockRestore()
  })

  test('should toggle star state of a board and trigger API call', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: Mocking API response for test spy
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ success: true } as any)
    // biome-ignore lint/suspicious/noExplicitAny: Mocking API response for test spy
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({ success: true } as any)

    useBoardStore.setState({
      boards: [
        {
          id: 1,
          workspace_id: 1,
          title: 'Board 1',
          created_at: '',
          updated_at: '',
          is_starred: false,
        },
      ],
      activeBoard: {
        id: 1,
        workspace_id: 1,
        title: 'Board 1',
        created_at: '',
        updated_at: '',
        is_starred: false,
      },
    })

    // Star the board
    await useBoardStore.getState().toggleStarBoard(1)
    let state = useBoardStore.getState()
    expect(state.boards[0].is_starred).toBe(true)
    expect(state.activeBoard?.is_starred).toBe(true)
    expect(postSpy).toHaveBeenCalledWith('/boards/1/star', {})

    // Unstar the board
    await useBoardStore.getState().toggleStarBoard(1)
    state = useBoardStore.getState()
    expect(state.boards[0].is_starred).toBe(false)
    expect(state.activeBoard?.is_starred).toBe(false)
    expect(deleteSpy).toHaveBeenCalledWith('/boards/1/star')

    postSpy.mockRestore()
    deleteSpy.mockRestore()
  })

  test('should modify lists and cards locally without API requests', () => {
    useBoardStore.setState({
      activeBoard: {
        id: 1,
        workspace_id: 1,
        title: 'Board',
        created_at: '',
        updated_at: '',
        lists: [
          {
            id: 10,
            board_id: 1,
            title: 'List 10',
            position: 0,
            created_at: '',
            updated_at: '',
            cards: [],
          },
        ],
      },
    })

    // Test addListLocally
    const newList = {
      id: 11,
      board_id: 1,
      title: 'List 11',
      position: 1,
      created_at: '',
      updated_at: '',
      cards: [],
    }
    useBoardStore.getState().addListLocally(newList)
    let state = useBoardStore.getState()
    expect(state.activeBoard?.lists?.length).toBe(2)
    expect(state.activeBoard?.lists?.[1].id).toBe(11)

    // Test addCardLocally
    const newCard = {
      id: 100,
      list_id: 10,
      title: 'New Card',
      position: 0,
      created_at: '',
      updated_at: '',
    }
    useBoardStore.getState().addCardLocally(newCard)
    state = useBoardStore.getState()
    expect(state.activeBoard?.lists?.[0].cards.length).toBe(1)
    expect(state.activeBoard?.lists?.[0].cards[0].id).toBe(100)

    // Test updateCardLocally
    const updatedCard = {
      id: 100,
      list_id: 10,
      title: 'Updated Card Title',
      position: 0,
      created_at: '',
      updated_at: '',
    }
    useBoardStore.getState().updateCardLocally(updatedCard)
    state = useBoardStore.getState()
    expect(state.activeBoard?.lists?.[0].cards[0].title).toBe('Updated Card Title')

    // Test moveCardLocally
    useBoardStore.getState().moveCardLocally({
      id: 100,
      from_list_id: 10,
      to_list_id: 11,
      position: 0,
    })
    state = useBoardStore.getState()
    expect(state.activeBoard?.lists?.[0].cards.length).toBe(0)
    expect(state.activeBoard?.lists?.[1].cards.length).toBe(1)
    expect(state.activeBoard?.lists?.[1].cards[0].id).toBe(100)

    // Test removeCardLocally
    useBoardStore.getState().removeCardLocally(100)
    state = useBoardStore.getState()
    expect(state.activeBoard?.lists?.[1].cards.length).toBe(0)
  })

  test('should handle activeTimer actions correctly', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: Mocking API response for test spy
    const getSpy = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ data: { card_id: 100, is_running: true, elapsed_seconds: 10 } } as any)
    // biome-ignore lint/suspicious/noExplicitAny: Mocking API response for test spy
    const postSpy = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { card_id: 100, is_running: true, elapsed_seconds: 0 } } as any)

    // 1. fetchActiveTimer
    await useBoardStore.getState().fetchActiveTimer()
    expect(getSpy).toHaveBeenCalledWith('/users/me/active-timer')
    expect(useBoardStore.getState().activeTimer?.card_id).toBe(100)

    // 2. startTimer
    await useBoardStore.getState().startTimer(100, 'Coding')
    expect(postSpy).toHaveBeenCalledWith('/cards/100/timer/start', { description: 'Coding' })

    // 3. stopTimer
    await useBoardStore.getState().stopTimer(100)
    expect(postSpy).toHaveBeenCalledWith('/cards/100/timer/stop', {})
    expect(useBoardStore.getState().activeTimer).toBeNull()

    getSpy.mockRestore()
    postSpy.mockRestore()
  })
})
