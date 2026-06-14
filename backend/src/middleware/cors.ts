import { cors } from 'hono/cors'

export const corsMiddleware = cors({
  origin: (origin, c) => {
    const origins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173']
    if (origins.includes(origin)) {
      return origin
    }
    // For local dev / testing or fallback
    if (origins.includes('*')) {
      return '*'
    }
    return origins[0]
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
})
