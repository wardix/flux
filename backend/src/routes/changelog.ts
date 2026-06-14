import { Hono } from 'hono'
import * as releaseService from '../services/releaseService'
import { db } from '../db'

export const changelogRoutes = new Hono()

// GET /api/changelog/:boardId
changelogRoutes.get('/:boardId', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (!boardId) return c.json({ error: 'Missing boardId' }, 400)

  const [board] = await db`SELECT id, title FROM boards WHERE id = ${boardId}`
  if (!board) return c.json({ error: 'Board not found' }, 404)

  const releases = await releaseService.getPublicChangelog(boardId)
  
  return c.json({ data: { board, releases } })
})

// GET /api/changelog/:boardId/:version
changelogRoutes.get('/:boardId/:version', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  const version = c.req.param('version')
  
  const [release] = await db`
    SELECT * FROM releases 
    WHERE board_id = ${boardId} AND version = ${version} AND status = 'published'
  `
  
  if (!release) return c.json({ error: 'Release not found' }, 404)
  
  return c.json({ data: release })
})
