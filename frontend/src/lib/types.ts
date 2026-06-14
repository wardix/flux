export interface Card {
  id: number
  list_id: number
  title: string
  description?: string | null
  position: number
  due_date?: string | null
  assignee_id?: number | null
  parent_card_id?: number | null
  story_points?: number | null
  archived_at?: string | null
  created_at: string
  updated_at: string
  labels?: Label[]
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
  created_by?: number | null
  created_at: string
  updated_at: string
  lists?: List[]
}

export interface Workspace {
  id: number
  name: string
  owner_id: number
  created_at: string
  updated_at: string
}

export interface Label {
  id: number
  board_id: number
  name: string
  color: string
  created_at?: string
  updated_at?: string
}
