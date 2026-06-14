import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { db } from '../src/db/index'

describe('Database Tests', () => {
  beforeAll(async () => {
    const schemaPath = path.join(__dirname, '../src/db/schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    await db.exec(schemaSql)
  })

  afterAll(async () => {
    await db`TRUNCATE TABLE cards, lists, boards, workspace_members, workspaces, users CASCADE`
  })

  test('Database Connection - verify SELECT 1 works', async () => {
    const result = await db`SELECT 1 as one`
    expect(result).toBeDefined()
    expect(result[0].one).toBe(1)
  })

  describe('boards table', () => {
    test('insert with required fields works', async () => {
      const userResult = await db`
        INSERT INTO users (email, password_hash)
        VALUES ('test_db_user@example.com', 'hashedpassword')
        RETURNING id
      `
      const userId = userResult[0].id

      const workspaceResult = await db`
        INSERT INTO workspaces (name, owner_id)
        VALUES ('Test Workspace', ${userId})
        RETURNING id
      `
      const workspaceId = workspaceResult[0].id

      const boardResult = await db`
        INSERT INTO boards (workspace_id, title, created_by)
        VALUES (${workspaceId}, 'Test Board', ${userId})
        RETURNING *
      `
      expect(boardResult).toBeDefined()
      expect(boardResult[0].title).toBe('Test Board')
      expect(boardResult[0].workspace_id).toBe(workspaceId)
    })

    test('reject insert without title', async () => {
      const userResult = await db`SELECT id FROM users LIMIT 1`
      const userId = userResult[0].id
      const workspaceResult = await db`SELECT id FROM workspaces LIMIT 1`
      const workspaceId = workspaceResult[0].id

      expect(async () => {
        await db`
          INSERT INTO boards (workspace_id, title, created_by)
          VALUES (${workspaceId}, NULL, ${userId})
        `
      }).toThrow()
    })
  })

  describe('lists table', () => {
    test('insert with valid board_id works', async () => {
      const boardResult = await db`SELECT id FROM boards LIMIT 1`
      const boardId = boardResult[0].id

      const listResult = await db`
        INSERT INTO lists (board_id, title, position)
        VALUES (${boardId}, 'Todo List', 0)
        RETURNING *
      `
      expect(listResult).toBeDefined()
      expect(listResult[0].title).toBe('Todo List')
      expect(listResult[0].board_id).toBe(boardId)
    })

    test('reject insert with invalid board_id', async () => {
      expect(async () => {
        await db`
          INSERT INTO lists (board_id, title)
          VALUES (999999, 'Invalid Board List')
        `
      }).toThrow()
    })

    test('cascade delete when board deleted', async () => {
      const userResult = await db`SELECT id FROM users LIMIT 1`
      const userId = userResult[0].id
      const workspaceResult = await db`SELECT id FROM workspaces LIMIT 1`
      const workspaceId = workspaceResult[0].id

      const tempBoard = await db`
        INSERT INTO boards (workspace_id, title, created_by)
        VALUES (${workspaceId}, 'Temp Board', ${userId})
        RETURNING id
      `
      const tempBoardId = tempBoard[0].id

      const tempList = await db`
        INSERT INTO lists (board_id, title)
        VALUES (${tempBoardId}, 'Temp List')
        RETURNING id
      `
      const tempListId = tempList[0].id

      const listCheckBefore = await db`SELECT id FROM lists WHERE id = ${tempListId}`
      expect(listCheckBefore.length).toBe(1)

      await db`DELETE FROM boards WHERE id = ${tempBoardId}`

      const listCheckAfter = await db`SELECT id FROM lists WHERE id = ${tempListId}`
      expect(listCheckAfter.length).toBe(0)
    })
  })

  describe('cards table', () => {
    test('insert with valid list_id works', async () => {
      const listResult = await db`SELECT id FROM lists LIMIT 1`
      const listId = listResult[0].id

      const cardResult = await db`
        INSERT INTO cards (list_id, title, position)
        VALUES (${listId}, 'Test Card', 0)
        RETURNING *
      `
      expect(cardResult).toBeDefined()
      expect(cardResult[0].title).toBe('Test Card')
      expect(cardResult[0].list_id).toBe(listId)
    })

    test('cascade delete when list deleted', async () => {
      const boardResult = await db`SELECT id FROM boards LIMIT 1`
      const boardId = boardResult[0].id

      const tempListName = 'Temp List for Card Cascade'
      const tempList = await db`
        INSERT INTO lists (board_id, title)
        VALUES (${boardId}, ${tempListName})
        RETURNING id
      `
      const tempListId = tempList[0].id

      const tempCard = await db`
        INSERT INTO cards (list_id, title)
        VALUES (${tempListId}, 'Temp Card')
        RETURNING id
      `
      const tempCardId = tempCard[0].id

      const cardCheckBefore = await db`SELECT id FROM cards WHERE id = ${tempCardId}`
      expect(cardCheckBefore.length).toBe(1)

      await db`DELETE FROM lists WHERE id = ${tempListId}`

      const cardCheckAfter = await db`SELECT id FROM cards WHERE id = ${tempCardId}`
      expect(cardCheckAfter.length).toBe(0)
    })

    test('cascade delete when board deleted', async () => {
      const userResult = await db`SELECT id FROM users LIMIT 1`
      const userId = userResult[0].id
      const workspaceResult = await db`SELECT id FROM workspaces LIMIT 1`
      const workspaceId = workspaceResult[0].id

      const tempBoard = await db`
        INSERT INTO boards (workspace_id, title, created_by)
        VALUES (${workspaceId}, 'Temp Board for Card Cascade', ${userId})
        RETURNING id
      `
      const tempBoardId = tempBoard[0].id

      const tempList = await db`
        INSERT INTO lists (board_id, title)
        VALUES (${tempBoardId}, 'Temp List for Card Cascade')
        RETURNING id
      `
      const tempListId = tempList[0].id

      const tempCard = await db`
        INSERT INTO cards (list_id, title)
        VALUES (${tempListId}, 'Temp Card')
        RETURNING id
      `
      const tempCardId = tempCard[0].id

      const cardCheckBefore = await db`SELECT id FROM cards WHERE id = ${tempCardId}`
      expect(cardCheckBefore.length).toBe(1)

      await db`DELETE FROM boards WHERE id = ${tempBoardId}`

      const cardCheckAfter = await db`SELECT id FROM cards WHERE id = ${tempCardId}`
      expect(cardCheckAfter.length).toBe(0)
    })
  })
})
