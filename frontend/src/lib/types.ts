export type BoardViewType = 'kanban' | 'table' | 'calendar' | 'timeline'

export interface Card {
  id: number
  list_id: number
  title: string
  description?: string | null
  position: number
  start_date?: string | null
  due_date?: string | null
  assignee_id?: number | null
  parent_card_id?: number | null
  is_completed?: boolean
  story_points?: number | null
  archived_at?: string | null
  deleted_at?: string | null
  created_at: string
  updated_at: string
  labels?: Label[]
  subtask_count?: { total: number; completed: number }
  checklist_count?: { total: number; completed: number }
  cover_file_path?: string | null
  assignee_email?: string | null
  assignee_avatar?: string | null
  vote_count?: number
  user_voted?: boolean
  sprint_id?: number | null
  epic_id?: number | null
  is_recurring?: boolean
  is_mirror?: boolean
  source_board_title?: string | null
  source_board_id?: number | null
  cover_color?: string | null
  cover_image_url?: string | null
}

export interface RecurringRule {
  id: number
  card_id: number
  frequency: 'daily' | 'weekly' | 'monthly'
  next_run: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Voter {
  id: number
  name: string
  avatar_url: string | null
  voted_at: string
}

export interface SubtaskCard extends Card {
  parent_card_id: number
  is_completed: boolean
}

export interface CreateSubtaskRequest {
  title: string
  description?: string
  due_date?: string
}

export interface UpdateSubtaskRequest {
  title?: string
  description?: string
  due_date?: string | null
  is_completed?: boolean
}

export interface List {
  id: number
  board_id: number
  title: string
  position: number
  created_at: string
  updated_at: string
  cards: Card[]
}

export interface Board {
  id: number
  workspace_id: number
  title: string
  visibility: string
  background?: string | null
  bg_image_url?: string | null
  bg_color?: string | null
  created_by?: number | null
  created_at: string
  updated_at: string
  lists?: List[]
  is_starred?: boolean
}

export interface WorkspaceBranding {
  id: number
  workspace_id: number
  app_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  custom_domain: string | null
  custom_css: string | null
}

export interface Workspace {
  id: number
  name: string
  owner_id: number
  created_at: string
  updated_at: string
  branding?: WorkspaceBranding | null
}

export interface Label {
  id: number
  board_id: number
  name: string
  color: string
  created_at?: string
  updated_at?: string
}

export interface WSEvent {
  type: string
  payload: any
  boardId: number
  userId: number
  userName: string
  timestamp: string
}

export interface PresenceUser {
  id: number
  name: string
  avatar_url: string | null
}

export interface TimeLog {
  id: number
  card_id: number
  user_id: number
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  description: string | null
  is_running: boolean
  created_at: string
  updated_at: string
  email?: string
}

export interface ActiveTimer extends TimeLog {
  elapsed_seconds: number
}

export interface UserTimeSummary {
  user_id: number
  email: string
  duration_seconds: number
}

export interface ManualTimeLogRequest {
  started_at: string
  ended_at?: string
  duration_seconds?: number
  description?: string
}

export interface CustomField {
  id: number
  board_id: number
  name: string
  field_type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox'
  options?: {
    choices?: string[]
  } | null
  is_required: boolean
  position: number
  created_at?: string
  updated_at?: string
}

export interface CustomFieldValueData {
  field_id: number
  field_name?: string
  field_type?: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox'
  field_options?: { choices?: string[] } | null
  value: string | null
}

export interface AutomationRule {
  id: number
  board_id: number
  name: string
  description: string | null
  trigger_event: 'card_created' | 'card_moved' | 'card_assigned' | 'due_date_reached'
  trigger_config: Record<string, any>
  action_type: 'move_card' | 'assign_user' | 'add_label' | 'send_notification'
  action_config: Record<string, any>
  is_enabled: boolean
  created_by: number
  execution_count: number
  last_executed_at: string | null
  created_at: string
}

export interface Sprint {
  id: number
  board_id: number
  title: string
  goal: string | null
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'completed'
  created_at: string
  updated_at: string
}

export interface Epic {
  id: number
  workspace_id: number
  title: string
  description?: string | null
  color: string
  status: 'open' | 'done'
  created_by?: number | null
  created_at: string
  updated_at: string
  progress?: {
    total_cards: number
    completed_cards: number
    percentage: number
  }
}

export interface EpicDetailCard {
  id: number
  title: string
  board_id: number
  board_title: string
  list_id: number
  list_title: string
  due_date: string | null
  is_completed: boolean
  assignees: { id: number; name: string }[]
}

export interface EpicDetail extends Epic {
  cards: EpicDetailCard[]
}

export interface CardMirror {
  id: number
  source_card_id: number
  mirror_board_id: number
  mirror_list_id: number
  mirror_card_id: number
  created_at: string
  updated_at: string
  mirror_board_title?: string
  mirror_list_title?: string
  source_board_title?: string
}

export interface Goal {
  id: number
  workspace_id: number
  parent_id: number | null
  title: string
  description: string | null
  type: 'objective' | 'key_result'
  status: 'active' | 'completed' | 'cancelled'
  target_value: number | null
  current_value: number
  unit: string | null
  due_date: string | null
  color: string | null
  progress: number
  created_by: number
  created_at: string
  updated_at: string
}

export interface GoalWithKeyResults extends Goal {
  key_results: Goal[]
  linked_cards_count?: number
  completed_cards_count?: number
}

export interface CreateGoalRequest {
  workspace_id: number
  parent_id?: number | null
  title: string
  description?: string
  type: 'objective' | 'key_result'
  target_value?: number
  unit?: string
  due_date?: string
  color?: string
}

export interface AISuggestionResult {
  type: 'labels' | 'summarize' | 'assignee'
  data: {
    suggested_labels?: Array<{ id: number; name: string; confidence: number }>
    summary?: string
    key_points?: string[]
    suggested_assignees?: Array<{ id: number; name: string; confidence: number; reason: string }>
    reasoning?: string
  }
}

export interface SearchResult {
  id: number
  title: string
  description: string | null
  due_date: string | null
  list_id: number
  list_title: string
  board_id: number
  board_title: string
  labels: { id: number; name: string; color: string }[]
  assignees: { id: number; name: string; avatar_url: string | null }[]
}

export interface ActiveFilters {
  assigneeIds: number[]
  labelIds: number[]
  dueStatus: 'all' | 'overdue' | 'due_today' | 'due_week' | 'no_date'
}

export interface Notification {
  id: number
  type: 'assigned' | 'mentioned' | 'due_soon' | 'comment'
  title: string
  message: string
  is_read: boolean
  card_id: number | null
  board_id: number | null
  actor: { id: number; name: string; avatar_url: string | null } | null
  created_at: string
}
