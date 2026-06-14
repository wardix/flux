import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { db } from '../db'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'

const recurringRoutes = new OpenAPIHono()
recurringRoutes.use('*', authMiddleware)

const createRecurringRuleRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Recurring Tasks'],
  summary: 'Create a recurring task rule for a card',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            card_id: z.number().openapi({ example: 1 }),
            frequency: z.enum(['daily', 'weekly', 'monthly']).openapi({ example: 'weekly' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Recurring task rule created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
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
  },
})

const getRecurringRuleRoute = createRoute({
  method: 'get',
  path: '/card/{cardId}',
  tags: ['Recurring Tasks'],
  summary: 'Get recurring task rule for a card',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      cardId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Recurring task rule data',
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
})

const updateRecurringRuleRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Recurring Tasks'],
  summary: 'Update a recurring task rule',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
            is_active: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Recurring task rule updated successfully',
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

const deleteRecurringRuleRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Recurring Tasks'],
  summary: 'Delete a recurring task rule',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Recurring task rule deleted',
    },
  },
})

recurringRoutes.openapi(createRecurringRuleRoute, async (c) => {
  const body = await c.req.json()
  const { card_id, frequency } = body

  if (!card_id || !frequency) {
    return c.json({ error: 'card_id and frequency are required' }, 400)
  }

  // Set next run based on frequency
  const next_run = calculateNextRun(frequency)

  try {
    await db.begin(async (db) => {
      // Toggle card state is_recurring = true
      await db`UPDATE cards SET is_recurring = TRUE WHERE id = ${card_id}`

      // Delete existing recurring rule for this card if any
      await db`DELETE FROM recurring_tasks WHERE card_id = ${card_id}`
    })

    const [rule] = await db`
      INSERT INTO recurring_tasks (card_id, frequency, next_run)
      VALUES (${card_id}, ${frequency}, ${next_run})
      RETURNING *
    `

    return c.json({ data: rule }, 201)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

recurringRoutes.openapi(getRecurringRuleRoute, async (c) => {
  const cardId = Number(c.req.param('cardId'))
  if (Number.isNaN(cardId)) return c.json({ error: 'Invalid ID' }, 400)

  const result = await db`SELECT * FROM recurring_tasks WHERE card_id = ${cardId}`
  return c.json({ data: result[0] || null }, 200)
})

recurringRoutes.openapi(updateRecurringRuleRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const [existing] = await db`SELECT * FROM recurring_tasks WHERE id = ${id}`
  if (!existing) return c.json({ error: 'Recurring rule not found' }, 404)

  const updates: Record<string, any> = {}
  if (body.frequency !== undefined) {
    updates.frequency = body.frequency
    updates.next_run = calculateNextRun(body.frequency)
  }
  if (body.is_active !== undefined) {
    updates.is_active = body.is_active
    // Sync to card table
    await db`UPDATE cards SET is_recurring = ${body.is_active} WHERE id = ${existing.card_id}`
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ data: existing }, 200)
  }

  const [rule] = await db`
    UPDATE recurring_tasks
    SET ${db(updates)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return c.json({ data: rule }, 200)
})

recurringRoutes.openapi(deleteRecurringRuleRoute, async (c) => {
  const id = Number(c.req.param('id'))
  if (Number.isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const [existing] = await db`SELECT * FROM recurring_tasks WHERE id = ${id}`
  if (existing) {
    await db.begin(async (db) => {
      await db`UPDATE cards SET is_recurring = FALSE WHERE id = ${existing.card_id}`
      await db`DELETE FROM recurring_tasks WHERE id = ${id}`
    })
  }

  return c.body(null, 204)
})

function calculateNextRun(frequency: string): Date {
  const date = new Date()
  if (frequency === 'daily') {
    date.setDate(date.getDate() + 1)
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7)
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  }
  return date
}

export { recurringRoutes }
