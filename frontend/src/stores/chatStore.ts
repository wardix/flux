import { create } from 'zustand'
import { api } from '../lib/api'
import { ChannelWithMeta, ChatMessage } from '../lib/types'
import { useAuthStore } from './authStore'

interface ChatState {
  isOpen: boolean
  channels: ChannelWithMeta[]
  activeChannelId: number | null
  messages: Record<number, ChatMessage[]> // channelId -> messages
  hasMore: Record<number, boolean>
  nextCursor: Record<number, number | null>
  unreadTotal: number
  isLoadingChannels: boolean
  
  toggleChat: () => void
  setIsOpen: (isOpen: boolean) => void
  fetchChannels: () => Promise<void>
  setActiveChannel: (channelId: number | null) => void
  fetchMessages: (channelId: number, loadMore?: boolean) => Promise<void>
  sendMessage: (channelId: number, content: string) => Promise<void>
  editMessage: (messageId: number, content: string) => Promise<void>
  deleteMessage: (messageId: number) => Promise<void>
  handleIncomingMessage: (msg: ChatMessage) => void
  handleMessageUpdated: (msg: ChatMessage) => void
  handleMessageDeleted: (payload: { id: number }) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  channels: [],
  activeChannelId: null,
  messages: {},
  hasMore: {},
  nextCursor: {},
  unreadTotal: 0,
  isLoadingChannels: false,

  toggleChat: () => set(state => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
  
  fetchChannels: async () => {
    set({ isLoadingChannels: true })
    try {
      const res = await api.get<{ data: ChannelWithMeta[] }>('/chat/channels')
      const totalUnread = res.data.reduce((sum, c) => sum + c.unread_count, 0)
      set({ channels: res.data, unreadTotal: totalUnread, isLoadingChannels: false })
    } catch (e) {
      console.error(e)
      set({ isLoadingChannels: false })
    }
  },

  setActiveChannel: (channelId) => {
    set({ activeChannelId: channelId })
    if (channelId) {
      const state = get()
      if (!state.messages[channelId]) {
        state.fetchMessages(channelId)
      }
      
      // Clear unread count for this channel
      const updatedChannels = state.channels.map(c => 
        c.id === channelId ? { ...c, unread_count: 0 } : c
      )
      const totalUnread = updatedChannels.reduce((sum, c) => sum + c.unread_count, 0)
      set({ channels: updatedChannels, unreadTotal: totalUnread })
    }
  },

  fetchMessages: async (channelId, loadMore = false) => {
    const state = get()
    const cursor = loadMore ? state.nextCursor[channelId] : null
    
    let url = `/chat/channels/${channelId}/messages?limit=20`
    if (cursor) url += `&cursor=${cursor}`
    
    try {
      const res = await api.get<{ data: ChatMessage[], meta: { has_more: boolean, next_cursor: number | null } }>(url)
      
      set(prev => {
        const existing = prev.messages[channelId] || []
        return {
          messages: {
            ...prev.messages,
            [channelId]: loadMore ? [...res.data, ...existing] : res.data
          },
          hasMore: {
            ...prev.hasMore,
            [channelId]: res.meta.has_more
          },
          nextCursor: {
            ...prev.nextCursor,
            [channelId]: res.meta.next_cursor
          }
        }
      })
    } catch (e) {
      console.error(e)
    }
  },

  sendMessage: async (channelId, content) => {
    try {
      const res = await api.post<{ data: ChatMessage }>(`/chat/channels/${channelId}/messages`, { content })
      // Incoming message handled by WS or optimistic update
      // We will rely on WS handleIncomingMessage or just push it here
      // For now, let WS handle it, but wait, if it's sent, the API returns it. We can optimistic update.
      set(state => {
        const existing = state.messages[channelId] || []
        // Avoid duplicate if WS is faster
        if (!existing.find(m => m.id === res.data.id)) {
          return {
            messages: {
              ...state.messages,
              [channelId]: [...existing, res.data]
            }
          }
        }
        return state
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  },
  
  editMessage: async (messageId, content) => {
    try {
      await api.put(`/chat/messages/${messageId}`, { content })
    } catch (e) {
      console.error(e)
      throw e
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await api.delete(`/chat/messages/${messageId}`)
    } catch (e) {
      console.error(e)
      throw e
    }
  },

  handleIncomingMessage: (msg: ChatMessage) => {
    const state = get()
    const isChannelActive = state.activeChannelId === msg.channel_id && state.isOpen
    
    set(prev => {
      const existing = prev.messages[msg.channel_id] || []
      // Don't add if already exists
      if (existing.find(m => m.id === msg.id)) return prev

      const updatedChannels = prev.channels.map(c => {
        if (c.id === msg.channel_id) {
          return {
            ...c,
            last_message: msg,
            unread_count: isChannelActive ? 0 : c.unread_count + 1
          }
        }
        return c
      })

      // If channel is not in list (e.g. newly added to DM), we should probably fetchChannels()
      if (!prev.channels.find(c => c.id === msg.channel_id)) {
        setTimeout(() => get().fetchChannels(), 500)
      }

      return {
        messages: {
          ...prev.messages,
          [msg.channel_id]: [...existing, msg]
        },
        channels: updatedChannels,
        unreadTotal: updatedChannels.reduce((sum, c) => sum + c.unread_count, 0)
      }
    })
  },

  handleMessageUpdated: (msg: ChatMessage) => {
    set(prev => {
      const existing = prev.messages[msg.channel_id] || []
      return {
        messages: {
          ...prev.messages,
          [msg.channel_id]: existing.map(m => m.id === msg.id ? msg : m)
        }
      }
    })
  },

  handleMessageDeleted: (payload: { id: number }) => {
    set(prev => {
      // We don't have channel_id in payload, so search all
      const newMessages = { ...prev.messages }
      for (const [chId, msgs] of Object.entries(newMessages)) {
        newMessages[Number(chId)] = msgs.map(m => m.id === payload.id ? { ...m, deleted_at: new Date().toISOString() } : m)
      }
      return { messages: newMessages }
    })
  }
}))
