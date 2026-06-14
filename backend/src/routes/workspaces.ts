import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as workspaceService from '../services/workspaceService'

const workspaceRoutes = new Hono()

workspaceRoutes.use('*', authMiddleware)

workspaceRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const list = await workspaceService.getAllForUser(userId)
  return c.json({ data: list })
})

workspaceRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.name) return c.json({ error: 'Name is required' }, 400)

    const userId = c.get('userId')
    const workspace = await workspaceService.create(userId, body.name)
    return c.json({ data: workspace }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

workspaceRoutes.get('/:id/members', async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const members = await workspaceService.getMembers(id)
  return c.json({ data: members })
})

workspaceRoutes.post('/:id/members', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const body = await c.req.json()
    if (!body.email) return c.json({ error: 'Email is required' }, 400)

    const member = await workspaceService.inviteMember(id, body.email, body.role || 'member')
    return c.json({ data: member }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    if (message === 'User with this email does not exist') {
      return c.json({ error: message }, 404)
    }
    if (message === 'User is already a member of this workspace') {
      return c.json({ error: message }, 409)
    }
    return c.json({ error: message }, 500)
  }
})

export { workspaceRoutes }
