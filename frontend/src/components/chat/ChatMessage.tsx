import React, { useState } from 'react'
import { ChatMessage as IChatMessage } from '../../lib/types'
import { useAuthStore } from '../../stores/authStore'
import { format } from 'date-fns'

interface Props {
  message: IChatMessage
  onEdit: (id: number, content: string) => void
  onDelete: (id: number) => void
}

export function ChatMessage({ message, onEdit, onDelete }: Props) {
  const { user } = useAuthStore()
  const isMe = user?.id === message.user_id
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const handleSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent)
    }
    setIsEditing(false)
  }

  // Very simple parsing for mentions and card links
  const renderContent = (content: string) => {
    if (message.deleted_at) {
      return <span className="italic text-base-content/50">This message was deleted</span>
    }

    const parts = content.split(/(@\d+|#\d+)/g)
    
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const id = part.slice(1)
        return <span key={i} className="text-primary font-bold bg-primary/10 px-1 rounded">@{id}</span> // In real app, resolve to name
      }
      if (part.startsWith('#')) {
        const id = part.slice(1)
        return <a key={i} href={`#card-${id}`} className="text-secondary font-bold hover:underline bg-secondary/10 px-1 rounded">#{id}</a>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-image avatar">
        <div className="w-8 rounded-full">
          <img src={message.user?.avatar_url || `https://ui-avatars.com/api/?name=${message.user?.name || 'User'}`} alt="avatar" />
        </div>
      </div>
      <div className="chat-header text-xs mb-1 flex gap-2 items-baseline">
        <span className="font-bold">{message.user?.name}</span>
        <time className="text-xs opacity-50">{format(new Date(message.created_at), 'HH:mm')}</time>
      </div>
      <div className={`chat-bubble text-sm ${isMe ? 'chat-bubble-primary text-primary-content' : 'chat-bubble-base-200 text-base-content'} ${message.deleted_at ? 'opacity-50' : ''}`}>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea 
              className="textarea textarea-xs text-base-content bg-base-100 rounded w-full" 
              value={editContent} 
              onChange={e => setEditContent(e.target.value)} 
              autoFocus
            />
            <div className="flex gap-1 justify-end">
              <button type="button" className="btn btn-xs btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="button" className="btn btn-xs btn-success text-white" onClick={handleSave}>Save</button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>
        )}
      </div>
      {!message.deleted_at && isMe && !isEditing && (
        <div className="chat-footer opacity-0 transition-opacity hover:opacity-100 mt-1 flex gap-2">
          <button type="button" className="text-xs text-base-content/50 hover:text-base-content" onClick={() => setIsEditing(true)}>Edit</button>
          <button type="button" className="text-xs text-error/70 hover:text-error" onClick={() => onDelete(message.id)}>Delete</button>
        </div>
      )}
      {message.edited_at && !message.deleted_at && !isEditing && (
        <div className="chat-footer opacity-50 text-[10px]">
          (edited)
        </div>
      )}
    </div>
  )
}
