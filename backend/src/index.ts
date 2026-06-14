import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { verify } from 'hono/jwt'
import { cleanOldTrash, db, startRecurringTasksScheduler } from './db'
import { apiDoc } from './lib/openapi'
import { corsMiddleware } from './middleware/cors'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { activityRoutes } from './routes/activities'
import { adminRoutes } from './routes/admin'
import { attachmentRoutes } from './routes/attachments'
import { authRoutes } from './routes/auth'
import { automationRoutes } from './routes/automations'
import { boardRoutes } from './routes/boards'
import { boardTemplateRoutes } from './routes/boardTemplates'
import { cardRoutes } from './routes/cards'
import { checklistRoutes } from './routes/checklists'
import { dependencyRoutes } from './routes/dependencies'
import { commentRoutes } from './routes/comments'
import { boardCustomFieldRoutes, cardCustomFieldRoutes } from './routes/customFields'
import { docsRoutes } from './routes/docs'
import { epicRoutes } from './routes/epics'
import { exportRoutes } from './routes/export'
import { goalRoutes } from './routes/goals'
import { unsplashRoutes } from './routes/unsplash'
import { aiRoutes } from './routes/ai'
import { brandingRoutes } from './routes/branding'
import { searchRoutes } from './routes/search'
import { notificationRoutes } from './routes/notifications'

import { batchRoutes } from './routes/batch'
import { importRoutes } from './routes/import'
import { labelRoutes } from './routes/labels'
import { listRoutes } from './routes/lists'
import { mirrorRoutes } from './routes/mirrors'
import { oauthRoutes } from './routes/oauth'
import { personalAccessRoutes } from './routes/personalAccessTokens'
import { formRoutes } from './routes/publicForms'
import { recurringRoutes } from './routes/recurring'
import { sprintRoutes } from './routes/sprints'
import { subtaskRoutes } from './routes/subtasks'
import { timeTrackingRoutes } from './routes/timeTracking'
import { twoFactorRoutes } from './routes/twoFactor'
import { userRoutes } from './routes/users'
import { voteRoutes } from './routes/votes'
import { webhookRoutes } from './routes/webhooks'
import { emailWebhooksRoutes } from './routes/emailWebhooks'
import { boardEmailsRoutes } from './routes/boardEmails'
import { chatRoutes } from './routes/chat'
import { workspaceRoutes } from './routes/workspaces'
import { websocket } from './websocket'

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

app.route('/api/cards/batch', batchRoutes)
app.route('/api/cards', cardRoutes)
app.route('/api/cards', mirrorRoutes)
app.route('/api/goals', goalRoutes)
app.route('/api/unsplash', unsplashRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api/search', searchRoutes)
app.route('/api/notifications', notificationRoutes)

app.route('/api/workspaces', workspaceRoutes)
app.route('/api/workspaces', brandingRoutes)
app.route('/api/labels', labelRoutes)
app.route('/api', subtaskRoutes)
app.route('/api', dependencyRoutes)
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
app.route('/api/boards/:boardId/email', boardEmailsRoutes)
app.route('/api/webhooks', emailWebhooksRoutes)
app.route('/api/import', importRoutes)
app.route('/api', formRoutes)
app.route('/api/chat', chatRoutes)

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
