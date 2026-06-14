import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { checkObserverPermission } from './permission'

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
    console.error('JWT verification error:', err)
    return c.json({ error: 'Invalid token' }, 401)
  }
}

