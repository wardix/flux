import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { db } from '../db'
import { authMiddleware } from '../middleware/auth'
import { logActivity } from '../services/activityService'
import * as automationService from '../services/automationService'
import * as cardService from '../services/cardService'
import * as dependencyService from '../services/dependencyService'
import * as listService from '../services/listService'
import * as webhookService from '../services/webhookService'
import * as notificationService from '../services/notificationService'
import { broadcastToBoard } from '../websocket/events'
import { approvalService } from '../services/approvalService'

async function getUserName(userId: number): Promise<string> {
  const result = await db`SELECT email FROM users WHERE id = ${userId}`
  return result[0]?.email.split('@')[0] || 'User'
}

async function getBoardIdByListId(listId: number): Promise<number | null> {
  const result = await db`SELECT board_id FROM lists WHERE id = ${listId}`
  return result[0] ? Number(result[0].board_id) : null
}

import { CardSchema, CreateCardRequest, ErrorSchema } from '../lib/schemas'

const cardRoutes = new OpenAPIHono()

const getCardByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Cards'],
  summary: 'Get card by ID',
  description: 'Get details of a specific card by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
  },
  responses: {
    200: {
      description: 'Card details',
      content: {
        'application/json': {
          schema: z.object({
            data: CardSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid ID',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Card not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const createCardRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Cards'],
  summary: 'Create card',
  description: 'Create a new card under a specific list',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCardRequest.extend({
            story_points: z.number().nullable().optional().openapi({ example: 5 }),
            start_date: z.string().nullable().optional().openapi({ example: '2026-06-25T00:00:00.000Z' }),
            is_recurring: z.boolean().optional(),
            description_json: z.any().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Card created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: CardSchema,
          }),
        },
      },
    },
    400: {
      description: 'Bad request (validation failed)',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const updateCardPositionsRoute = createRoute({
  method: 'put',
  path: '/positions',
  tags: ['Cards'],
  summary: 'Update card positions',
  description: 'Update ordering positions of multiple cards in bulk (typically for drag and drop)',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            cards: z.array(
              z.object({
                id: z.number().openapi({ example: 1 }),
                list_id: z.number().openapi({ example: 1 }),
                position: z.number().openapi({ example: 2 }),
              }),
            ),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Positions updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
          }),
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const updateCardRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Cards'],
  summary: 'Update card',
  description: 'Update the properties of an existing card (title, description, list, points, etc.)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional().openapi({ example: 'Updated Title' }),
            description: z
              .string()
              .nullable()
              .optional()
              .openapi({ example: 'Updated Description' }),
            description_json: z.any().nullable().optional(),
            list_id: z.number().optional().openapi({ example: 1 }),
            position: z.number().optional().openapi({ example: 1 }),
            start_date: z
              .string()
              .nullable()
              .optional()
              .openapi({ example: '2026-06-25T00:00:00.000Z' }),
            due_date: z
              .string()
              .nullable()
              .optional()
              .openapi({ example: '2026-06-30T00:00:00.000Z' }),
            assignee_id: z.number().nullable().optional().openapi({ example: 1 }),
            is_completed: z.boolean().optional().openapi({ example: true }),
            story_points: z.number().nullable().optional().openapi({ example: 8 }),
            cover_color: z.string().nullable().optional().openapi({ example: '#ff0000' }),
            cover_image_url: z.string().nullable().optional().openapi({ example: 'https://example.com/cover.png' }),
            archived_at: z.string().nullable().optional(),
            deleted_at: z.string().nullable().optional(),
            is_recurring: z.boolean().optional(),
            latitude: z.number().nullable().optional(),
            longitude: z.number().nullable().optional(),
            address: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Card updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: CardSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid input or ID',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Card not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const deleteCardRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Cards'],
  summary: 'Delete card',
  description: 'Soft-delete or permanently delete a card by its ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1' }),
    }),
    query: z.object({
      permanent: z.string().optional().openapi({ example: 'true' }),
    }),
  },
  responses: {
    204: {
      description: 'Card deleted successfully (no content)',
    },
    400: {
      description: 'Invalid ID',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Card not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

cardRoutes.use('*', authMiddleware)

cardRoutes.openapi(getCardByIdRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const card = await cardService.getById(id)
    if (!card) return c.json({ error: 'Card not found' }, 404)

    return c.json({ data: card }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(createCardRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    if (!body.list_id) return c.json({ error: 'list_id is required' }, 400)
    if (!body.title) return c.json({ error: 'Title is required' }, 400)

    if ('story_points' in body) {
      const sp = body.story_points
      if (sp !== null && sp !== undefined) {
        if (typeof sp !== 'number' || !Number.isInteger(sp) || sp < 0 || sp > 100) {
          return c.json({ error: 'story_points must be an integer between 0 and 100' }, 400)
        }
      }
    }

    const card = await cardService.create(body)
    await logActivity(card.id, userId, 'created', card.title)

    const boardId = await getBoardIdByListId(card.list_id)
    if (boardId && body.assignee_id) {
      await notificationService.createNotification({
        user_id: body.assignee_id,
        actor_id: userId,
        type: 'assigned',
        title: 'You were assigned to a card',
        message: `You were assigned to the card "${card.title}"`,
        card_id: card.id,
        board_id: boardId
      })
    }

    if (boardId) {
      // Trigger card_created automation
      await automationService.processAutomations({
        type: 'card_created',
        boardId,
        cardId: card.id,
      })

      // Trigger card_created webhook
      await webhookService.triggerWebhooks(boardId, 'card_created', card)

      const userName = await getUserName(userId)
      broadcastToBoard(boardId, {
        type: 'card_created',
        payload: card,
        boardId,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      })
    }

    return c.json({ data: card }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(updateCardPositionsRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    if (!body.cards || !Array.isArray(body.cards)) {
      return c.json({ error: 'cards array is required' }, 400)
    }

    const firstCard = body.cards[0]
    let boardId: number | null = null
    let movedCardPayload: any = null

    if (firstCard) {
      boardId = await getBoardIdByListId(firstCard.list_id)
      const cardIds = body.cards.map((c: any) => c.id)
      const existingCards =
        await db`SELECT id, list_id, position FROM cards WHERE id IN (${cardIds})`

      for (const item of body.cards) {
        const existing = existingCards.find((c) => c.id === item.id)
        if (existing && existing.list_id !== item.list_id) {
          movedCardPayload = {
            id: item.id,
            from_list_id: existing.list_id,
            to_list_id: item.list_id,
            position: item.position,
          }
          break
        }
      }
      if (!movedCardPayload) {
        for (const item of body.cards) {
          const existing = existingCards.find((c) => c.id === item.id)
          if (existing && existing.position !== item.position) {
            movedCardPayload = {
              id: item.id,
              from_list_id: existing.list_id,
              to_list_id: item.list_id,
              position: item.position,
            }
            break
          }
        }
      }
    }

    let warningMsg: string | undefined

    if (movedCardPayload && movedCardPayload.from_list_id !== movedCardPayload.to_list_id) {
      const blockedRes = await dependencyService.isCardBlocked(movedCardPayload.id)
      if (blockedRes.isBlocked) {
        const blockerTitles = blockedRes.blockers.map(b => `"${b.title}"`).join(', ')
        warningMsg = `Card is still blocked by: ${blockerTitles}`
      }
      const canMove = await approvalService.canMoveCard(movedCardPayload.id, movedCardPayload.to_list_id)
      if (!canMove) return c.json({ error: 'Insufficient approvals to move card' }, 403)
    }

    await cardService.updatePositions(body.cards)

    if (boardId && movedCardPayload) {
      if (movedCardPayload.from_list_id !== movedCardPayload.to_list_id) {
        // Trigger card_moved automation
        await automationService.processAutomations({
          type: 'card_moved',
          boardId,
          cardId: movedCardPayload.id,
          data: { to_list_id: movedCardPayload.to_list_id },
        })
      }

      // Trigger card_moved webhook
      await webhookService.triggerWebhooks(boardId, 'card_moved', movedCardPayload)

      const userName = await getUserName(userId)
      broadcastToBoard(boardId, {
        type: 'card_moved',
        payload: movedCardPayload,
        boardId,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      })
    }

    return c.json({ success: true, warning: warningMsg }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(updateCardRoute, async (c) => {
  try {
    const userId = c.get('userId')
    const id = Number(c.req.param('id'))
    if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

    const oldCards = await db`SELECT * FROM cards WHERE id = ${id}`
    if (oldCards.length === 0) return c.json({ error: 'Card not found' }, 404)
    const oldCard = oldCards[0]

    const body = await c.req.json()
    if ('story_points' in body) {
      const sp = body.story_points
      if (sp !== null && sp !== undefined) {
        if (typeof sp !== 'number' || !Number.isInteger(sp) || sp < 0 || sp > 100) {
          return c.json({ error: 'story_points must be an integer between 0 and 100' }, 400)
        }
      }
    }
    const card = await cardService.update(id, body)
    if (!card) return c.json({ error: 'Card not found' }, 404)

    if (body.latitude !== undefined && body.longitude !== undefined) {
      if (body.latitude === null || body.longitude === null) {
        await cardService.removeLocation(id)
      } else {
        await cardService.updateLocation(id, body.latitude, body.longitude, body.address || '')
      }
    }

    // Log what changed
    if (body.title && body.title !== oldCard.title) {
      await logActivity(id, userId, 'updated_title', body.title)
    }
    if (body.description !== undefined && body.description !== oldCard.description) {
      await logActivity(id, userId, 'updated_description', body.description)
    }
    if (body.start_date !== undefined && body.start_date !== oldCard.start_date) {
      await logActivity(id, userId, 'updated_start_date', body.start_date)
    }
    if (body.due_date !== undefined && body.due_date !== oldCard.due_date) {
      await logActivity(id, userId, 'updated_due_date', body.due_date)
    }
    if (body.story_points !== undefined && body.story_points !== oldCard.story_points) {
      await logActivity(
        id,
        userId,
        'updated_story_points',
        body.story_points ? String(body.story_points) : 'removed',
      )
    }
    if (body.list_id !== undefined && body.list_id !== oldCard.list_id) {
      await logActivity(id, userId, 'moved_list', String(body.list_id))
    }
    if (body.assignee_id !== undefined && body.assignee_id !== oldCard.assignee_id) {
      await logActivity(
        id,
        userId,
        'updated_assignee',
        body.assignee_id ? String(body.assignee_id) : 'unassigned',
      )
      if (body.assignee_id) {
        const boardId = await getBoardIdByListId(card.list_id)
        if (boardId) {
          await notificationService.createNotification({
            user_id: body.assignee_id,
            actor_id: userId,
            type: 'assigned',
            title: 'You were assigned to a card',
            message: `You were assigned to the card "${card.title}"`,
            card_id: card.id,
            board_id: boardId
          })
        }
      }
    }
    if (body.archived_at !== undefined && body.archived_at !== oldCard.archived_at) {
      await logActivity(id, userId, body.archived_at ? 'archived' : 'restored')
    }

    const boardId = await getBoardIdByListId(card.list_id)
    if (boardId) {
      if (body.list_id !== undefined && body.list_id !== oldCard.list_id) {
        await automationService.processAutomations({
          type: 'card_moved',
          boardId,
          cardId: card.id,
          data: { to_list_id: body.list_id },
        })
        // Trigger card_moved webhook
        await webhookService.triggerWebhooks(boardId, 'card_moved', {
          id: card.id,
          from_list_id: oldCard.list_id,
          to_list_id: body.list_id,
        })
      }
      if (
        body.assignee_id !== undefined &&
        body.assignee_id !== oldCard.assignee_id &&
        body.assignee_id !== null
      ) {
        await automationService.processAutomations({
          type: 'card_assigned',
          boardId,
          cardId: card.id,
          data: { assignee_id: body.assignee_id },
        })
        // Trigger card_assigned webhook
        await webhookService.triggerWebhooks(boardId, 'card_assigned', card)
      }

      const userName = await getUserName(userId)
      broadcastToBoard(boardId, {
        type: 'card_updated',
        payload: card,
        boardId,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      })
    }

    return c.json({ data: card }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

const moveCardRoute = createRoute({
  method: 'put',
  path: '/{id}/move',
  tags: ['Cards'],
  summary: 'Move card to a list',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            list_id: z.number().int(),
            position: z.number().int(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Success' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    500: { description: 'Server error' }
  },
})

cardRoutes.openapi(moveCardRoute, async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    
    const canMove = await approvalService.canMoveCard(id, body.list_id)
    if (!canMove) {
      return c.json({ error: 'Insufficient approvals to move card' }, 403)
    }

    const card = await cardService.update(id, { list_id: body.list_id, position: body.position })
    if (!card) return c.json({ error: 'Card not found' }, 404)
    
    return c.json({ data: card }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return c.json({ error: message }, 500)
  }
})

cardRoutes.openapi(deleteCardRoute, async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const permanent = c.req.query('permanent') === 'true'
  const card = permanent
    ? await cardService.remove(id)
    : await cardService.update(id, { deleted_at: new Date().toISOString() })
  if (!card) return c.json({ error: 'Card not found' }, 404)

  if (!permanent) {
    await logActivity(id, userId, 'deleted')
  }

  const boardId = await getBoardIdByListId(card.list_id)
  if (boardId) {
    const userName = await getUserName(userId)
    broadcastToBoard(boardId, {
      type: 'card_deleted',
      payload: { id: card.id },
      boardId,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    })
  }

  return c.body(null, 204)
})

// Assign Card to Sprint Endpoint
const assignCardSprintRoute = createRoute({
  method: 'put',
  path: '/{id}/sprint',
  tags: ['Cards'],
  summary: 'Assign card to sprint',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            sprint_id: z.number().nullable(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Sprint assigned successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
  },
})

cardRoutes.openapi(assignCardSprintRoute, async (c) => {
  const cardId = Number(c.req.param('id'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const sprintId = body.sprint_id

  try {
    const sprintService = await import('../services/sprintService')
    const card = await sprintService.assignCardToSprint(cardId, sprintId)
    return c.json({ data: card }, 200)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

// Assign Card to Epic Endpoint
const assignCardEpicRoute = createRoute({
  method: 'put',
  path: '/{id}/epic',
  tags: ['Cards'],
  summary: 'Assign card to epic',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            epic_id: z.number().nullable(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Epic assigned successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
  },
})

cardRoutes.openapi(assignCardEpicRoute, async (c) => {
  const cardId = Number(c.req.param('id'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const epicId = body.epic_id

  try {
    const epicService = await import('../services/epicService')
    const card = await epicService.assignCardToEpic(cardId, epicId)
    return c.json({ data: card }, 200)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

// GET /api/cards/:id/goals
const getCardGoalsRoute = createRoute({
  method: 'get',
  path: '/{id}/goals',
  tags: ['Cards'],
  summary: 'Get card linked goals',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Linked goals retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
          }),
        },
      },
    },
  },
})

cardRoutes.openapi(getCardGoalsRoute, async (c) => {
  const cardId = Number(c.req.param('id'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)

  const goalService = await import('../services/goalService')
  const goals = await goalService.getGoalsByCardId(cardId)
  return c.json({ data: goals }, 200)
})

export { cardRoutes }
