import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { ErrorSchema } from '../lib/schemas'
import { authMiddleware } from '../middleware/auth'
import * as automationService from '../services/automationService'

const automationRoutes = new OpenAPIHono()
automationRoutes.use('*', authMiddleware)

const getRulesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Automations'],
  summary: 'Get all automation rules for a board',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'List of automation rules',
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

const createRuleRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Automations'],
  summary: 'Create a new automation rule',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            description: z.string().nullable().optional(),
            trigger_event: z.enum([
              'card_created',
              'card_moved',
              'card_assigned',
              'due_date_reached',
            ]),
            trigger_config: z.any(),
            action_type: z.enum(['move_card', 'assign_user', 'add_label', 'send_notification']),
            action_config: z.any(),
            is_enabled: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Automation rule created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Validation failed',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const updateRuleRoute = createRoute({
  method: 'put',
  path: '/{ruleId}',
  tags: ['Automations'],
  summary: 'Update an automation rule',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      ruleId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().optional(),
            description: z.string().nullable().optional(),
            trigger_event: z
              .enum(['card_created', 'card_moved', 'card_assigned', 'due_date_reached'])
              .optional(),
            trigger_config: z.any().optional(),
            action_type: z
              .enum(['move_card', 'assign_user', 'add_label', 'send_notification'])
              .optional(),
            action_config: z.any().optional(),
            is_enabled: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Automation rule updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.any(),
          }),
        },
      },
    },
    400: {
      description: 'Validation failed',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Automation rule not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
})

const deleteRuleRoute = createRoute({
  method: 'delete',
  path: '/{ruleId}',
  tags: ['Automations'],
  summary: 'Delete an automation rule',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      boardId: z.string(),
      ruleId: z.string(),
    }),
  },
  responses: {
    204: {
      description: 'Automation rule deleted successfully',
    },
    400: {
      description: 'Validation failed',
    },
  },
})

automationRoutes.openapi(getRulesRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const rules = await automationService.getRulesByBoard(boardId)
  return c.json({ data: rules }, 200)
})

automationRoutes.openapi(createRuleRoute, async (c) => {
  const boardId = Number(c.req.param('boardId'))
  if (Number.isNaN(boardId)) return c.json({ error: 'Invalid board ID' }, 400)

  const user = c.get('user')
  const body = await c.req.json()

  try {
    const rule = await automationService.createRule(boardId, user.id, body)
    return c.json({ data: rule }, 201)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

automationRoutes.openapi(updateRuleRoute, async (c) => {
  const ruleId = Number(c.req.param('ruleId'))
  if (Number.isNaN(ruleId)) return c.json({ error: 'Invalid rule ID' }, 400)

  const body = await c.req.json()

  try {
    const rule = await automationService.updateRule(ruleId, body)
    return c.json({ data: rule }, 200)
  } catch (err: any) {
    const status = err.status || 400
    return c.json({ error: err.message }, status)
  }
})

automationRoutes.openapi(deleteRuleRoute, async (c) => {
  const ruleId = Number(c.req.param('ruleId'))
  if (Number.isNaN(ruleId)) return c.json({ error: 'Invalid rule ID' }, 400)

  await automationService.deleteRule(ruleId)
  return c.body(null, 204)
})

export { automationRoutes }
