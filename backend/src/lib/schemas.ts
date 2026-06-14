import { z } from '@hono/zod-openapi'

// Reusable schemas untuk OpenAPI documentation

// User Schema
export const UserSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    email: z.string().email().openapi({ example: 'user@example.com' }),
    avatar_url: z.string().nullable().openapi({ example: 'https://example.com/avatar.png' }),
    is_super_admin: z.boolean().openapi({ example: false }),
    is_suspended: z.boolean().openapi({ example: false }),
    locale: z.string().openapi({ example: 'en' }),
    created_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
  })
  .openapi('User')

// Board Schema
export const BoardSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    workspace_id: z.number().openapi({ example: 1 }),
    title: z.string().openapi({ example: 'Project Board' }),
    visibility: z.string().openapi({ example: 'private' }),
    background: z.string().nullable().openapi({ example: 'blue' }),
    created_by: z.number().openapi({ example: 1 }),
    archived_at: z.string().nullable().openapi({ example: null }),
    deleted_at: z.string().nullable().openapi({ example: null }),
    created_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
  })
  .openapi('Board')

// List Schema
export const ListSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    board_id: z.number().openapi({ example: 1 }),
    title: z.string().openapi({ example: 'To Do' }),
    position: z.number().openapi({ example: 1 }),
    archived_at: z.string().nullable().openapi({ example: null }),
    deleted_at: z.string().nullable().openapi({ example: null }),
    created_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
  })
  .openapi('List')

// Card Schema
export const CardSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    list_id: z.number().openapi({ example: 1 }),
    title: z.string().openapi({ example: 'Implement login page' }),
    description: z.string().nullable().openapi({ example: 'Use OAuth and password credentials' }),
    position: z.number().openapi({ example: 1 }),
    due_date: z.string().nullable().openapi({ example: '2026-06-20T00:00:00.000Z' }),
    assignee_id: z.number().nullable().openapi({ example: null }),
    parent_card_id: z.number().nullable().openapi({ example: null }),
    is_completed: z.boolean().openapi({ example: false }),
    story_points: z.number().nullable().openapi({ example: 5 }),
    archived_at: z.string().nullable().openapi({ example: null }),
    deleted_at: z.string().nullable().openapi({ example: null }),
    created_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
  })
  .openapi('Card')

// Label Schema
export const LabelSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    board_id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'Bug' }),
    color: z.string().openapi({ example: '#ff0000' }),
    created_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
  })
  .openapi('Label')

// Workspace Schema
export const WorkspaceSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'My Workspace' }),
    owner_id: z.number().openapi({ example: 1 }),
    created_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
  })
  .openapi('Workspace')

// Workspace Member Schema
export const WorkspaceMemberSchema = z
  .object({
    user_id: z.number().openapi({ example: 1 }),
    workspace_id: z.number().openapi({ example: 1 }),
    role: z.string().openapi({ example: 'member' }),
    created_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
    updated_at: z.string().openapi({ example: '2026-06-14T04:49:15.000Z' }),
  })
  .openapi('WorkspaceMember')

// Error Schema
export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: 'An error occurred' }),
  })
  .openapi('Error')

// Pagination Meta
export const PaginationMeta = z
  .object({
    page: z.number().openapi({ example: 1 }),
    perPage: z.number().openapi({ example: 10 }),
    total: z.number().openapi({ example: 100 }),
  })
  .openapi('PaginationMeta')

// Request schemas
export const CreateBoardRequest = z
  .object({
    title: z.string().min(1).max(255).openapi({ example: 'Project Board' }),
    description: z.string().optional().openapi({ example: 'Board description' }),
    workspace_id: z.number().openapi({ example: 1 }),
  })
  .openapi('CreateBoardRequest')

export const CreateCardRequest = z
  .object({
    title: z.string().min(1).max(500).openapi({ example: 'Implement login page' }),
    description: z.string().optional().openapi({ example: 'Use OAuth and password credentials' }),
    list_id: z.number().openapi({ example: 1 }),
    position: z.number().optional().openapi({ example: 1 }),
  })
  .openapi('CreateCardRequest')
