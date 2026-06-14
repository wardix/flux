import { create } from 'zustand'
import { api } from '../lib/api'
import type { SummaryData, StatusCount, MemberCount, CompletionData, VelocityData } from '../lib/types'

interface AnalyticsState {
  boardId: number | null
  period: 'week' | 'month' | 'sprint'
  summary: SummaryData | null
  cardsByStatus: StatusCount[]
  cardsByMember: MemberCount[]
  completionRate: CompletionData[]
  velocity: VelocityData[]
  isLoading: boolean
  error: string | null

  setBoardId: (boardId: number) => void
  setPeriod: (period: 'week' | 'month' | 'sprint') => void
  fetchAll: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  boardId: null,
  period: 'month',
  summary: null,
  cardsByStatus: [],
  cardsByMember: [],
  completionRate: [],
  velocity: [],
  isLoading: false,
  error: null,

  setBoardId: (boardId) => {
    set({ boardId })
    get().fetchAll()
  },
  
  setPeriod: (period) => {
    set({ period })
    get().fetchAll()
  },

  fetchAll: async () => {
    const { boardId, period } = get()
    if (!boardId) return

    set({ isLoading: true, error: null })
    try {
      const [
        summaryRes,
        statusRes,
        memberRes,
        completionRes,
        velocityRes
      ] = await Promise.all([
        api.get<{ data: SummaryData }>(`/analytics/summary?board_id=${boardId}&period=${period}`),
        api.get<{ data: StatusCount[] }>(`/analytics/cards-by-status?board_id=${boardId}&period=${period}`),
        api.get<{ data: MemberCount[] }>(`/analytics/cards-by-member?board_id=${boardId}&period=${period}`),
        api.get<{ data: CompletionData[] }>(`/analytics/completion-rate?board_id=${boardId}&period=${period}`),
        api.get<{ data: VelocityData[] }>(`/analytics/velocity?board_id=${boardId}&period=${period}`)
      ])

      set({
        summary: summaryRes.data,
        cardsByStatus: statusRes.data,
        cardsByMember: memberRes.data,
        completionRate: completionRes.data,
        velocity: velocityRes.data,
      })
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Failed to load analytics data' })
    } finally {
      set({ isLoading: false })
    }
  }
}))
