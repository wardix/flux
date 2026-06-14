import type { MiddlewareHandler } from 'hono'

export const limitMap = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries periodically
const interval = setInterval(() => {
  const now = Date.now()
  for (const [key, value] of limitMap.entries()) {
    if (now >= value.resetAt) {
      limitMap.delete(key)
    }
  }
}, 30000)

// Allow clean cleanup in tests if needed (unref to avoid hanging node process)
if (interval && typeof interval.unref === 'function') {
  interval.unref()
}

export const rateLimitMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const clientIp = c.req.header('x-forwarded-for') || '127.0.0.1'
    let userId: number | null = c.get('userId') || null

    if (!userId) {
      const authHeader = c.req.header('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const payload = JSON.parse(atob(token.split('.')[1]))
          if (payload && payload.sub) {
            userId = Number(payload.sub)
          }
        } catch {
          // ignore
        }
      }
    }

    const now = Date.now()
    let key = `ip:${clientIp}`
    let limit = 100

    if (userId) {
      key = `user:${userId}`
      limit = 1000
    }

    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT !== 'true') {
      limit = 100000
    }

    let record = limitMap.get(key)
    if (!record || now >= record.resetAt) {
      record = {
        count: 0,
        resetAt: now + 60000,
      }
    }

    record.count++
    limitMap.set(key, record)

    if (record.count > limit) {
      const remainingMs = Math.max(0, record.resetAt - now)
      const retryAfter = Math.ceil(remainingMs / 1000)
      c.header('Retry-After', String(retryAfter))
      return c.json({ error: 'Too many requests. Please try again later.' }, 429)
    }

    await next()
  }
}
