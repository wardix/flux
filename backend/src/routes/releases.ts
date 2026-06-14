import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as releaseService from '../services/releaseService'
import { z } from 'zod'

export const releaseRoutes = new Hono()

releaseRoutes.use('*', authMiddleware)

// GET /api/boards/:boardId/releases
releaseRoutes.get('/', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (!boardId) return c.json({ error: 'Missing boardId' }, 400)
  const releases = await releaseService.getReleases(boardId)
  return c.json({ data: releases })
})

// POST /api/boards/:boardId/releases
releaseRoutes.post('/', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (!boardId) return c.json({ error: 'Missing boardId' }, 400)

  const body = await c.req.json()
  const schema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format. Use x.y.z'),
    title: z.string().min(1),
    items: z.array(z.object({
      card_id: z.number().optional().nullable(),
      category: z.string(),
      summary: z.string()
    }))
  })

  try {
    const data = schema.parse(body)
    const release = await releaseService.createRelease(boardId, c.get('userId'), data)
    return c.json({ data: release }, 201)
  } catch (err: any) {
    if (err.message === 'DUPLICATE_VERSION') {
      return c.json({ error: 'Version already exists for this board' }, 409)
    }
    return c.json({ error: err.errors || err.message }, 400)
  }
})

// POST /api/boards/:boardId/releases/generate
releaseRoutes.post('/generate', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (!boardId) return c.json({ error: 'Missing boardId' }, 400)

  const body = await c.req.json()
  const schema = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format. Use x.y.z'),
    title: z.string().min(1),
    from_date: z.string(),
    to_date: z.string()
  })

  try {
    const data = schema.parse(body)
    const release = await releaseService.generateRelease(boardId, c.get('userId'), data)
    return c.json({ data: release }, 201)
  } catch (err: any) {
    if (err.message === 'DUPLICATE_VERSION') {
      return c.json({ error: 'Version already exists for this board' }, 409)
    }
    return c.json({ error: err.errors || err.message }, 400)
  }
})

// GET /api/boards/:boardId/releases/:id
releaseRoutes.get('/:id', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  const id = Number(c.req.param('id'))
  const release = await releaseService.getReleaseById(id, boardId)
  if (!release) return c.json({ error: 'Release not found' }, 404)
  return c.json({ data: release })
})

// PUT /api/boards/:boardId/releases/:id
releaseRoutes.put('/:id', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const release = await releaseService.updateRelease(id, boardId, body)
  return c.json({ data: release })
})

// PUT /api/boards/:boardId/releases/:id/publish
releaseRoutes.put('/:id/publish', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  const id = Number(c.req.param('id'))
  const release = await releaseService.publishRelease(id, boardId)
  return c.json({ data: release })
})

// DELETE /api/boards/:boardId/releases/:id
releaseRoutes.delete('/:id', async (c) => {
  const boardId = Number(c.req.param('boardId'))
  const id = Number(c.req.param('id'))
  const release = await releaseService.deleteRelease(id, boardId)
  return c.json({ data: release })
})
