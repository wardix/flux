import React, { useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { ChannelList } from './ChannelList'
import { ChatMessageList } from './ChatMessageList'
import { ChatInput } from './ChatInput'

export function ChatPanel() {
  const { isOpen, setIsOpen, activeChannelId, fetchChannels, channels } = useChatStore()

  useEffect(() => {
    if (isOpen) {
      fetchChannels()
    }
  }, [isOpen])

  if (!isOpen) return null

  const activeChannel = channels.find(c => c.id === activeChannelId)

  return (
    <div className="fixed bottom-0 right-4 w-[800px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[80vh] bg-base-100 shadow-2xl rounded-t-xl flex flex-col z-50 border border-base-300 overflow-hidden transform transition-transform duration-300 translate-y-0">
      <div className="flex h-full">
        <ChannelList />
        
        <div className="flex-1 flex flex-col min-w-0 bg-base-50 relative">
          {activeChannel ? (
            <>
              {/* Channel Header */}
              <div className="p-3 border-b border-base-300 bg-base-100 flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="font-bold">
                    {activeChannel.type === 'group' ? activeChannel.name : activeChannel.members.filter(m => m.id !== activeChannel.members[0].id)[0]?.name || 'Chat'}
                  </div>
                  {activeChannel.type === 'group' && (
                    <div className="text-xs text-base-content/50 bg-base-200 px-2 py-0.5 rounded-full">
                      {activeChannel.members.length} members
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-xs btn-square hover:bg-error/20 hover:text-error transition-colors" 
                  onClick={() => setIsOpen(false)}
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <ChatMessageList channelId={activeChannel.id} />
              <ChatInput channelId={activeChannel.id} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-base-content/50 p-6 text-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-20">forum</span>
              <h3 className="text-lg font-bold mb-2 text-base-content/70">Welcome to Chat</h3>
              <p className="text-sm max-w-sm">Select a channel from the left or create a new direct message to start chatting with your team.</p>
              
              <button 
                type="button" 
                className="btn btn-ghost btn-circle absolute top-2 right-2 hover:bg-error/20 hover:text-error" 
                onClick={() => setIsOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
