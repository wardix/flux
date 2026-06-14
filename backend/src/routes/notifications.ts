import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as notificationService from '../services/notificationService'
import { db } from '../db'

const notificationRoutes = new OpenAPIHono()

notificationRoutes.use('*', authMiddleware)

notificationRoutes.openapi(createRoute({
  method: 'get',
  path: '/',
  responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } }
}), async (c) => {
  const userId = c.get('userId')
  const unreadOnly = c.req.query('unread') === 'true'
  const notifications = await notificationService.getNotifications(userId, unreadOnly)
  const unreadCount = await notificationService.getUnreadCount(userId)
  return c.json({ data: notifications, meta: { unread_count: unreadCount.count } }, 200)
})

notificationRoutes.openapi(createRoute({
  method: 'put',
  path: '/{id}/read',
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: 'OK' }, 404: { description: 'Not found' }, 403: { description: 'Forbidden' } }
}), async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const notif = await notificationService.markAsRead(id, userId)
  if (!notif) {
    const existing = await db`SELECT * FROM notifications WHERE id = ${id}`
    if (existing.length === 0) return c.json({ error: 'Not found' }, 404)
    if (existing[0].user_id !== userId) return c.json({ error: 'Forbidden' }, 403)
  }
  return c.json({ data: notif }, 200)
})

notificationRoutes.openapi(createRoute({
  method: 'put',
  path: '/read-all',
  responses: { 200: { description: 'OK' } }
}), async (c) => {
  const userId = c.get('userId')
  const result = await notificationService.markAllAsRead(userId)
  return c.json({ data: result }, 200)
})

notificationRoutes.openapi(createRoute({
  method: 'get',
  path: '/unread-count',
  responses: { 200: { description: 'OK' } }
}), async (c) => {
  const userId = c.get('userId')
  const result = await notificationService.getUnreadCount(userId)
  return c.json({ data: result }, 200)
})

export { notificationRoutes }
