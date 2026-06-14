import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { cleanOldTrash, db, startRecurringTasksScheduler } from './db'
import { verify } from 'hono/jwt'
import { websocket } from './websocket'
import { authRoutes } from './routes/auth'
import { boardRoutes } from './routes/boards'
import { cardRoutes } from './routes/cards'
import { labelRoutes } from './routes/labels'
import { listRoutes } from './routes/lists'
import { subtaskRoutes } from './routes/subtasks'
import { workspaceRoutes } from './routes/workspaces'
import { docsRoutes } from './routes/docs'
import { apiDoc } from './lib/openapi'

import { twoFactorRoutes } from './routes/twoFactor'
import { oauthRoutes } from './routes/oauth'
import { checklistRoutes } from './routes/checklists'
import { attachmentRoutes } from './routes/attachments'
import { commentRoutes } from './routes/comments'
import { activityRoutes } from './routes/activities'
import { timeTrackingRoutes } from './routes/timeTracking'
import { voteRoutes } from './routes/votes'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { corsMiddleware } from './middleware/cors'
import { adminRoutes } from './routes/admin'
import { exportRoutes } from './routes/export'
import { userRoutes } from './routes/users'
import { boardCustomFieldRoutes, cardCustomFieldRoutes } from './routes/customFields'
import { automationRoutes } from './routes/automations'
import { sprintRoutes } from './routes/sprints'
import { epicRoutes } from './routes/epics'
import { recurringRoutes } from './routes/recurring'
import { boardTemplateRoutes } from './routes/boardTemplates'
import { personalAccessRoutes } from './routes/personalAccessTokens'
import { webhookRoutes } from './routes/webhooks'





// Trigger database old trash clean up on server startup
cleanOldTrash().catch((err) => console.error('Trash cleanup failed:', err))
startRecurringTasksScheduler()

const app = new OpenAPIHono()

app.use('*', corsMiddleware)
app.use('*', rateLimitMiddleware())

app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ error: err.message, stack: err.stack }, 500)
})

app.get('/', (c) => {
  return c.text('Flux API is running!')
})

// Register bearerAuth security component first
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

// Setup OpenAPI specification registry doc
app.doc('/api/docs/openapi.json', apiDoc)

// Mount route handlers
app.route('/api/docs', docsRoutes)
app.route('/api/auth/2fa', twoFactorRoutes)
app.route('/api/auth', oauthRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/boards', boardTemplateRoutes)
app.route('/api/boards', boardRoutes)
app.route('/api/lists', listRoutes)

app.route('/api/cards', cardRoutes)
app.route('/api/workspaces', workspaceRoutes)
app.route('/api/labels', labelRoutes)
app.route('/api', subtaskRoutes)
app.route('/api', checklistRoutes)
app.route('/api', attachmentRoutes)
app.route('/api', commentRoutes)
app.route('/api', activityRoutes)
app.route('/api', timeTrackingRoutes)
app.route('/api', voteRoutes)
app.route('/api', adminRoutes)
app.route('/api', exportRoutes)
app.route('/api', userRoutes)
app.route('/api/boards/:boardId/custom-fields', boardCustomFieldRoutes)
app.route('/api/cards/:cardId/custom-fields', cardCustomFieldRoutes)
app.route('/api/boards/:boardId/automations', automationRoutes)
app.route('/api/boards/:boardId/sprints', sprintRoutes)
app.route('/api/workspaces/:workspaceId/epics', epicRoutes)
app.route('/api/recurring-tasks', recurringRoutes)
app.route('/api/personal-access-tokens', personalAccessRoutes)
app.route('/api/boards/:boardId/webhooks', webhookRoutes)




export default {
  port: process.env.PORT || 3000,
  async fetch(req: Request, server: any) {
    const url = new URL(req.url)
    if (url.pathname === '/ws') {
      const token = url.searchParams.get('token')
      if (!token) {
        return new Response('Unauthorized', { status: 401 })
      }
      try {
        const secretKey = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'
        const payload = await verify(token, secretKey, 'HS256')
        const userId = Number(payload.sub)
        
        const users = await db`SELECT id, email, avatar_url FROM users WHERE id = ${userId}`
        if (users.length === 0) {
          return new Response('Unauthorized', { status: 401 })
        }
        const user = users[0]
        const userName = user.email.split('@')[0]
        
        const upgraded = server.upgrade(req, {
          data: {
            userId,
            userName,
            avatarUrl: user.avatar_url,
            boardId: null,
          },
        })
        if (upgraded) {
          return
        }
        return new Response('WebSocket upgrade failed', { status: 400 })
      } catch (err) {
        console.error('WS upgrade auth error:', err)
        return new Response('Unauthorized', { status: 401 })
      }
    }
    return app.fetch(req)
  },
  websocket,
}
