import { beforeEach, describe, expect, test } from 'vitest'
import { useBoardStore } from '../../src/stores/boardStore'

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({ boards: [], activeBoard: null, error: null, isLoading: false })
  })

  test('should initialize with default state', () => {
    const state = useBoardStore.getState()
    expect(state.boards).toEqual([])
    expect(state.activeBoard).toBeNull()
  })

  test('should create board in local state when fallback occurs', async () => {
    await useBoardStore.getState().createBoard('Test Local Board')
    const boards = useBoardStore.getState().boards
    expect(boards.length).toBe(1)
    expect(boards[0].title).toBe('Test Local Board')
  })

  test('should create list in local state when fallback occurs', async () => {
    useBoardStore.setState({
      activeBoard: {
        id: 1,
        workspace_id: 1,
        title: 'Board',
        visibility: 'public',
        created_at: '',
        updated_at: '',
        lists: [],
      },
    })

    await useBoardStore.getState().createList(1, 'Test List')
    const activeBoard = useBoardStore.getState().activeBoard
    expect(activeBoard?.lists?.length).toBe(1)
    expect(activeBoard?.lists?.[0].title).toBe('Test List')
  })
})
