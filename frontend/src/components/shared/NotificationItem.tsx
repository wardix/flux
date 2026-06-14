import React from 'react'
import type { Notification } from '../../lib/types'

interface NotificationItemProps {
  notification: Notification
  onClick: (notification: Notification) => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'assigned': return '👤'
      case 'comment': return '💬'
      case 'mentioned': return '🏷️'
      case 'due_soon': return '⏰'
      default: return '🔔'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-3 border-b border-base-200 cursor-pointer hover:bg-base-200 transition-colors flex gap-3 ${
        !notification.is_read ? 'bg-base-200/50' : 'bg-base-100'
      }`}
    >
      <div className="text-xl flex-shrink-0 mt-1">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${!notification.is_read ? 'font-bold' : ''}`}>
          {notification.title}
        </p>
        <p className="text-xs text-base-content/70 line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-base-content/50 mt-1">
          {formatTime(notification.created_at)}
        </p>
      </div>
      {notification.actor && (
        <div className="flex-shrink-0">
          {notification.actor.avatar_url ? (
            <img src={notification.actor.avatar_url} alt={notification.actor.name} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
              {notification.actor.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
