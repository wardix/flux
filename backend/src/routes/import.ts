import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth'
import * as importService from '../services/importService'
import { ErrorSchema, BoardSchema } from '../lib/schemas'

const importRoutes = new OpenAPIHono()
importRoutes.use('*', authMiddleware)

const importTrelloRoute = createRoute({
  method: 'post',
  path: '/trello',
  tags: ['Import'],
  summary: 'Import board from Trello JSON data',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            workspace_id: z.number().openapi({ example: 1 }),
            trello_data: z.object({
              name: z.string().openapi({ example: 'My Trello Board' }),
              lists: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  closed: z.boolean(),
                  pos: z.number(),
                })
              ).optional(),
              cards: z.array(
                z.object({
                  id: z.string(),
                  idList: z.string(),
                  name: z.string(),
                  desc: z.string(),
                  closed: z.boolean(),
                  pos: z.number(),
                  due: z.string().nullable().optional(),
                })
              ).optional(),
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Board imported successfully from Trello',
      content: {
        'application/json': {
          schema: z.object({
            data: BoardSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid input',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const importJiraRoute = createRoute({
  method: 'post',
  path: '/jira',
  tags: ['Import'],
  summary: 'Import board from Jira CSV-like JSON rows data',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            workspace_id: z.number().openapi({ example: 1 }),
            board_title: z.string().openapi({ example: 'Jira Migration Proj' }),
            jira_rows: z.array(
              z.object({
                summary: z.string().openapi({ example: 'Task summary' }),
                description: z.string().optional(),
                status: z.string().optional(),
                storyPoints: z.number().optional(),
                dueDate: z.string().optional(),
                assignee: z.string().optional(),
              })
            ),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Board imported successfully from Jira',
      content: {
        'application/json': {
          schema: z.object({
            data: BoardSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid input',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

importRoutes.openapi(importTrelloRoute, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const { workspace_id, trello_data } = body

  if (!workspace_id || !trello_data || !trello_data.name) {
    return c.json({ error: 'workspace_id and valid trello_data.name are required' }, 400)
  }

  try {
    const board = await importService.importTrello(workspace_id, userId, trello_data)
    return c.json({ data: board }, 201)
  } catch (err: any) {
    return c.json({ error: err.message || 'Import failed' }, 400)
  }
})

importRoutes.openapi(importJiraRoute, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const { workspace_id, board_title, jira_rows } = body

  if (!workspace_id || !board_title || !jira_rows || !Array.isArray(jira_rows)) {
    return c.json({ error: 'workspace_id, board_title and jira_rows array are required' }, 400)
  }

  try {
    const board = await importService.importJira(workspace_id, userId, board_title, jira_rows)
    return c.json({ data: board }, 201)
  } catch (err: any) {
    return c.json({ error: err.message || 'Import failed' }, 400)
  }
})

export { importRoutes }
