import { beforeEach, describe, expect, test } from 'vitest'
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
})
