import React, { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'

export function ChatInput({ channelId }: { channelId: number }) {
  const [content, setContent] = useState('')
  const { sendMessage } = useChatStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await sendMessage(channelId, content)
      setContent('')
    } catch (error) {
      console.error('Failed to send message', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-base-300 bg-base-100 flex gap-2">
      <textarea
        className="textarea textarea-bordered w-full resize-none min-h-[40px] max-h-[120px] py-2 px-3 leading-tight"
        placeholder="Type a message... (use @ to mention, # to link card)"
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={!content.trim() || isSubmitting}
      >
        <span className="material-symbols-outlined text-lg">send</span>
      </button>
    </form>
  )
}
