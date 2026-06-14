import { create } from 'zustand'
import { api } from '../lib/api'
import type { CreateGoalRequest, Goal, GoalWithKeyResults } from '../lib/types'

interface GoalState {
  goals: GoalWithKeyResults[]
  activeGoal: any | null
  isLoading: boolean
  error: string | null

  fetchGoals: (workspaceId: number) => Promise<void>
  fetchGoal: (id: number) => Promise<void>
  createGoal: (data: CreateGoalRequest) => Promise<void>
  updateGoal: (id: number, data: Partial<Goal>) => Promise<void>
  updateProgress: (id: number, currentValue: number) => Promise<void>
  deleteGoal: (id: number) => Promise<void>
  linkCard: (goalId: number, cardId: number) => Promise<void>
  unlinkCard: (goalId: number, cardId: number) => Promise<void>
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  activeGoal: null,
  isLoading: false,
  error: null,

  fetchGoals: async (workspaceId: number) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get<{ data: GoalWithKeyResults[] }>(
        `/goals?workspace_id=${workspaceId}`,
      )
      set({ goals: res.data || [], isLoading: false })
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Gagal memuat sasaran', isLoading: false })
    }
  },

  fetchGoal: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get<{ data: any }>(`/goals/${id}`)
      set({ activeGoal: res.data || null, isLoading: false })
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Gagal memuat detail sasaran', isLoading: false })
    }
  },

  createGoal: async (data: CreateGoalRequest) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/goals', data)
      await get().fetchGoals(data.workspace_id)
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Gagal membuat sasaran', isLoading: false })
      throw err
    }
  },

  updateGoal: async (id: number, data: Partial<Goal>) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.put<{ data: Goal }>(`/goals/${id}`, data)
      const workspaceId = res.data.workspace_id
      await get().fetchGoals(workspaceId)
      if (get().activeGoal && get().activeGoal.id === id) {
        await get().fetchGoal(id)
      }
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Gagal mengubah sasaran', isLoading: false })
      throw err
    }
  },

  updateProgress: async (id: number, currentValue: number) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.put<{ data: any }>(`/goals/${id}/progress`, {
        current_value: currentValue,
      })
      const workspaceId = res.data.workspace_id
      await get().fetchGoals(workspaceId)
      if (get().activeGoal && get().activeGoal.id === id) {
        await get().fetchGoal(id)
      }
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Gagal memperbarui kemajuan sasaran', isLoading: false })
      throw err
    }
  },

  deleteGoal: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const active = get().activeGoal
      await api.delete(`/goals/${id}`)
      set({ activeGoal: active && active.id === id ? null : active })
      // We don't have workspace_id directly from delete request response 204
      // So we will just fetch activeWorkspace ID from boardStore or refresh manually
      // We can also assume the active workspace is already loaded
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Gagal menghapus sasaran', isLoading: false })
      throw err
    }
  },

  linkCard: async (goalId: number, cardId: number) => {
    try {
      await api.post(`/goals/${goalId}/cards`, { card_id: cardId })
      if (get().activeGoal && get().activeGoal.id === goalId) {
        await get().fetchGoal(goalId)
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  },

  unlinkCard: async (goalId: number, cardId: number) => {
    try {
      await api.delete(`/goals/${goalId}/cards/${cardId}`)
      if (get().activeGoal && get().activeGoal.id === goalId) {
        await get().fetchGoal(goalId)
      }
    } catch (err: any) {
      console.error(err)
      throw err
    }
  },
}))
