import { create } from 'zustand'
import { api } from '../lib/api'

interface User {
  id: number
  email: string
  name?: string
  avatar_url?: string | null
}

interface AuthState {
  user: User | null
  workspaceUsers: User[]
  setUser: (user: User | null) => void
  fetchCurrentUser: () => Promise<void>
  fetchWorkspaceUsers: (workspaceId: number) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspaceUsers: [],

  setUser: (user) => set({ user }),

  fetchCurrentUser: async () => {
    try {
      const res = await api.get<{ data: User }>('/users/me')
      set({ user: res.data })
    } catch {
      set({ user: null })
    }
  },

  fetchWorkspaceUsers: async (workspaceId: number) => {
    try {
      const res = await api.get<{ data: User[] }>(`/workspaces/${workspaceId}/members`)
      set({ workspaceUsers: res.data })
    } catch {
      set({ workspaceUsers: [] })
    }
  },
}))
