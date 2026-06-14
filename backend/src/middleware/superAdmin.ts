import type { MiddlewareHandler } from 'hono'
import { db } from '../db'

export const superAdminMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const userId = c.get('userId')
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const [user] = await db`
        SELECT is_super_admin FROM users WHERE id = ${userId}
      `
      if (!user || !user.is_super_admin) {
        return c.json({ error: 'Forbidden' }, 403)
      }
    } catch (err) {
      console.error('Superadmin check error:', err)
      return c.json({ error: 'Internal server error' }, 500)
    }

    await next()
  }
}
