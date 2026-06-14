import { create } from 'zustand'
import { api } from '../lib/api'
import type { Notification } from '../lib/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isDropdownOpen: boolean
  error: string | null

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  toggleDropdown: () => void
  closeDropdown: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDropdownOpen: false,
  error: null,

  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true, error: null })
    try {
      const qs = unreadOnly ? '?unread=true' : ''
      const res = await api.get<{ data: Notification[], meta: { unread_count: number } }>(`/notifications${qs}`)
      set({ notifications: res.data, unreadCount: res.meta.unread_count, isLoading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch notifications', isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get<{ data: { count: number } }>('/notifications/unread-count')
      set({ unreadCount: res.data.count })
    } catch (error) {
      console.error('Failed to fetch unread count', error)
    }
  },

  markAsRead: async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`, {})
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all', {})
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }))
    } catch (error) {
      console.error('Failed to mark all as read', error)
    }
  },

  toggleDropdown: () => set((state) => ({ isDropdownOpen: !state.isDropdownOpen })),
  closeDropdown: () => set({ isDropdownOpen: false }),
}))
