import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { checkObserverPermission } from './permission'
import * as patService from '../services/personalAccessService'

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await verify(
      token,
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
      'HS256',
    )
    c.set('userId', Number(payload.sub))
    return await checkObserverPermission(c, next)
  } catch (err) {
    // Try validating as Personal Access Token
    const patUserId = await patService.validatePAT(token)
    if (patUserId !== null) {
      c.set('userId', patUserId)
      return await checkObserverPermission(c, next)
    }

    if (err instanceof Error && !err.message.includes('invalid JWT token')) {
      console.error('JWT verification error:', err)
    }
    return c.json({ error: 'Invalid token' }, 401)
  }
}

