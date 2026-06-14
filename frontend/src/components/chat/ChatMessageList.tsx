import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { ChatMessage } from './ChatMessage'

export function ChatMessageList({ channelId }: { channelId: number }) {
  const { messages, hasMore, fetchMessages, editMessage, deleteMessage } = useChatStore()
  const channelMessages = messages[channelId] || []
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom on load or new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [channelMessages.length])

  const handleLoadMore = () => {
    fetchMessages(channelId, true)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-base-200/30 flex flex-col gap-2" ref={scrollRef}>
      {hasMore[channelId] && (
        <button 
          onClick={handleLoadMore}
          className="btn btn-ghost btn-xs mx-auto mb-4 text-base-content/50"
        >
          Load previous messages
        </button>
      )}
      {channelMessages.map(msg => (
        <ChatMessage 
          key={msg.id} 
          message={msg} 
          onEdit={editMessage} 
          onDelete={deleteMessage} 
        />
      ))}
      {channelMessages.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-base-content/50 italic text-sm">
          No messages yet. Start the conversation!
        </div>
      )}
    </div>
  )
}
