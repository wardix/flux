import React, { useEffect, useRef } from 'react'
import { useNotificationStore } from '../../stores/notificationStore'
import { NotificationDropdown } from './NotificationDropdown'

export function NotificationBell() {
  const { 
    unreadCount, 
    isDropdownOpen, 
    toggleDropdown, 
    closeDropdown, 
    fetchNotifications, 
    fetchUnreadCount 
  } = useNotificationStore()
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    if (isDropdownOpen) {
      fetchNotifications()
    }
  }, [isDropdownOpen, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen, closeDropdown])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="btn btn-ghost btn-circle indicator"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="indicator-item badge badge-error badge-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      <NotificationDropdown />
    </div>
  )
}
