import { Context, Next } from 'hono'

export async function webhookAuthMiddleware(c: Context, next: Next) {
  const secret = c.req.query('secret')
  if (secret !== process.env.WEBHOOK_EMAIL_SECRET) {
    return c.json({ error: 'Invalid webhook secret' }, 403)
  }
  return next()
}
