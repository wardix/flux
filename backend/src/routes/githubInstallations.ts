import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { authMiddleware } from '../middleware/auth'
import { randomBytes } from 'crypto'

export const githubInstallationRoutes = new Hono()

// Apply auth middleware
githubInstallationRoutes.use('*', authMiddleware)

const createInstallationSchema = z.object({
  repo_full_name: z.string(),
  in_progress_list_id: z.number().int().optional().nullable(),
  review_list_id: z.number().int().optional().nullable(),
  done_list_id: z.number().int().optional().nullable(),
})

const updateInstallationSchema = z.object({
  in_progress_list_id: z.number().int().optional().nullable(),
  review_list_id: z.number().int().optional().nullable(),
  done_list_id: z.number().int().optional().nullable(),
})

// Check if user is admin of the board's workspace
async function checkBoardAdmin(c: any, next: any) {
  const boardId = parseInt(c.req.param('boardId'))
  const userId = c.get('userId')
  const [isAdmin] = await db`
    SELECT 1 FROM workspace_members wm 
    JOIN boards b ON b.workspace_id = wm.workspace_id 
    WHERE b.id = ${boardId} AND wm.user_id = ${userId} AND wm.role = 'admin'
  `
  if (!isAdmin) return c.json({ error: 'Unauthorized' }, 403)
  await next()
}

// GET /api/boards/:boardId/github
githubInstallationRoutes.get('/', async (c) => {
  const boardId = parseInt(c.req.param('boardId'))
  const installations = await db`
    SELECT * FROM github_installations WHERE board_id = ${boardId}
  `
  return c.json({ data: installations })
})

// POST /api/boards/:boardId/github
githubInstallationRoutes.post('/', checkBoardAdmin, zValidator('json', createInstallationSchema), async (c) => {
  const boardId = parseInt(c.req.param('boardId'))
  const data = c.req.valid('json')
  const webhook_secret = randomBytes(32).toString('hex')

  try {
    const [installation] = await db`
      INSERT INTO github_installations 
        (board_id, repo_full_name, webhook_secret, in_progress_list_id, review_list_id, done_list_id)
      VALUES 
        (${boardId}, ${data.repo_full_name}, ${webhook_secret}, ${data.in_progress_list_id || null}, ${data.review_list_id || null}, ${data.done_list_id || null})
      RETURNING *
    `
    return c.json({ data: installation }, 201)
  } catch (err: any) {
    if (err.code === '23505' || err.errno === '23505') {
      return c.json({ error: 'Repository is already installed for this board' }, 409)
    }
    throw err
  }
})

// PUT /api/boards/:boardId/github/:id
githubInstallationRoutes.put('/:id', checkBoardAdmin, zValidator('json', updateInstallationSchema), async (c) => {
  const id = parseInt(c.req.param('id'))
  const boardId = parseInt(c.req.param('boardId'))
  const data = c.req.valid('json')

  const [installation] = await db`
    UPDATE github_installations
    SET 
      in_progress_list_id = ${data.in_progress_list_id || null},
      review_list_id = ${data.review_list_id || null},
      done_list_id = ${data.done_list_id || null},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND board_id = ${boardId}
    RETURNING *
  `
  if (!installation) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: installation })
})

// DELETE /api/boards/:boardId/github/:id
githubInstallationRoutes.delete('/:id', checkBoardAdmin, async (c) => {
  const id = parseInt(c.req.param('id'))
  const boardId = parseInt(c.req.param('boardId'))

  const [deleted] = await db`
    DELETE FROM github_installations WHERE id = ${id} AND board_id = ${boardId} RETURNING id
  `
  if (!deleted) return c.json({ error: 'Not found' }, 404)
  return c.json({ success: true })
})
