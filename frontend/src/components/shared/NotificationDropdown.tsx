import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '../../stores/notificationStore'
import { NotificationItem } from './NotificationItem'

export function NotificationDropdown() {
  const { notifications, isDropdownOpen, markAllAsRead, markAsRead, closeDropdown } = useNotificationStore()
  const navigate = useNavigate()

  if (!isDropdownOpen) return null

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    closeDropdown()
    if (notification.board_id) {
      navigate(`/?board=${notification.board_id}&card=${notification.card_id}`)
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-base-100 rounded-box shadow-xl border border-base-200 z-50 overflow-hidden flex flex-col max-h-[400px]">
      <div className="flex items-center justify-between p-3 border-b border-base-200 bg-base-100/50 backdrop-blur sticky top-0">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="text-xs text-primary hover:text-primary-focus font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto flex-1 overscroll-contain">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-base-content/50 text-sm">
            No notifications yet
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
