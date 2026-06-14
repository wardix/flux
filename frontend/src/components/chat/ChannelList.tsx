import React, { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useAuthStore } from '../../stores/authStore'
import { formatDistanceToNow } from 'date-fns'
import { api } from '../../lib/api'

export function ChannelList() {
  const { channels, activeChannelId, setActiveChannel, fetchChannels } = useChatStore()
  const { user, workspaceUsers } = useAuthStore()
  const [isCreatingDM, setIsCreatingDM] = useState(false)

  const handleCreateDM = async (userId: number) => {
    try {
      const res = await api.post<{ data: { id: number } }>('/chat/channels/direct', { user_id: userId })
      await fetchChannels()
      setActiveChannel(res.data.id)
      setIsCreatingDM(false)
    } catch (e) {
      console.error(e)
    }
  }

  const getChannelName = (c: any) => {
    if (c.type === 'group') return c.name
    // DM: find the other user's name
    const otherUser = c.members.find((m: any) => m.id !== user?.id)
    return otherUser ? otherUser.name : 'Unknown User'
  }

  const getChannelAvatar = (c: any) => {
    if (c.type === 'group') return `https://ui-avatars.com/api/?name=${c.name}&background=random`
    const otherUser = c.members.find((m: any) => m.id !== user?.id)
    return otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUser?.name || 'U'}`
  }

  return (
    <div className="h-full flex flex-col bg-base-100 border-r border-base-300 w-64 flex-shrink-0">
      <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
        <h2 className="font-bold text-lg">Chats</h2>
        <div className="dropdown dropdown-bottom dropdown-end">
          <button type="button" tabIndex={0} className="btn btn-ghost btn-xs btn-square">
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-300">
            <li><a onClick={() => setIsCreatingDM(true)}>New Direct Message</a></li>
            {/* Group channel creation could be added here */}
          </ul>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreatingDM && (
          <div className="p-2 border-b border-base-300 bg-base-200/30">
            <div className="text-xs font-bold uppercase text-base-content/50 mb-2">Select User</div>
            <div className="space-y-1">
              {workspaceUsers.filter(u => u.id !== user?.id).map(wu => (
                <button
                  key={wu.id}
                  onClick={() => handleCreateDM(wu.id)}
                  className="w-full text-left px-2 py-1 hover:bg-base-300 rounded text-sm flex items-center gap-2"
                >
                  <img src={wu.avatar_url || `https://ui-avatars.com/api/?name=${wu.name}`} className="w-5 h-5 rounded-full" alt="avatar" />
                  {wu.name}
                </button>
              ))}
              <button 
                onClick={() => setIsCreatingDM(false)}
                className="w-full text-center px-2 py-1 mt-2 text-xs text-base-content/50 hover:bg-base-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <ul className="menu w-full p-2 gap-1">
          {channels.length === 0 && !isCreatingDM && (
            <li className="text-center py-4 text-base-content/50 italic text-sm">No chats yet</li>
          )}
          {channels.map(c => {
            const isActive = c.id === activeChannelId
            const hasUnread = c.unread_count > 0
            
            return (
              <li key={c.id}>
                <a 
                  className={`flex gap-3 items-center p-2 rounded-lg ${isActive ? 'bg-primary/10 text-primary font-medium' : ''} ${hasUnread && !isActive ? 'font-bold' : ''}`}
                  onClick={() => setActiveChannel(c.id)}
                >
                  <div className="indicator">
                    {hasUnread && !isActive && <span className="indicator-item badge badge-primary badge-xs scale-75 border-none"></span>}
                    <img src={getChannelAvatar(c)} alt="avatar" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="truncate text-sm">{getChannelName(c)}</span>
                      {c.last_message && (
                        <span className="text-[10px] opacity-50 flex-shrink-0">
                          {formatDistanceToNow(new Date(c.last_message.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {c.last_message && (
                      <div className={`text-xs truncate ${hasUnread && !isActive ? 'text-base-content font-medium' : 'text-base-content/60'}`}>
                        {c.last_message.user_name}: {c.last_message.content}
                      </div>
                    )}
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
