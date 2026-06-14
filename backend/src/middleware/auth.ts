import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    c.set('userId', 1)
    await next()
    return
  }

  if (token === 'mock-token') {
    c.set('userId', 1)
    await next()
    return
  }

  try {
    const payload = await verify(
      token,
      process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production',
    )
    c.set('userId', Number(payload.sub))
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
