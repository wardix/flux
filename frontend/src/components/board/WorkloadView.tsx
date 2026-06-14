import React, { useEffect, useState } from 'react'
import { WorkloadMember, WorkloadCard } from '../../lib/types'
import { CAPACITY_COLORS, CAPACITY_LABELS } from '../../lib/constants'
import { WorkloadBar } from './WorkloadBar'
import { WorkloadCardList } from './WorkloadCardList'

interface WorkloadViewProps {
  boardId: number
}

export const WorkloadView: React.FC<WorkloadViewProps> = ({ boardId }) => {
  const token = localStorage.getItem('token')
  const [members, setMembers] = useState<WorkloadMember[]>([])
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null)
  const [memberCards, setMemberCards] = useState<Record<number, WorkloadCard[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWorkload()
  }, [boardId])

  const fetchWorkload = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/workload?board_id=${boardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const { data } = await res.json()
      if (Array.isArray(data)) {
        setMembers(data)
      }
    } catch (err) {
      console.error('Failed to fetch workload', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMemberCards = async (userId: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/workload/${userId}/cards?board_id=${boardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const { data } = await res.json()
      if (Array.isArray(data)) {
        setMemberCards(prev => ({ ...prev, [userId]: data }))
      }
    } catch (err) {
      console.error('Failed to fetch member cards', err)
    }
  }

  const handleToggleMember = (userId: number) => {
    if (expandedMemberId === userId) {
      setExpandedMemberId(null)
    } else {
      setExpandedMemberId(userId)
      if (!memberCards[userId]) {
        fetchMemberCards(userId)
      }
    }
  }

  const handleCardClick = (cardId: number) => {
    // Should integrate with a global modal state or router to show card detail
    console.log('Open card', cardId)
  }

  if (isLoading) {
    return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>
  }

  return (
    <div className="flex flex-col h-full bg-base-100/50 p-6 rounded-xl border border-base-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Team Workload
          </h2>
          <p className="text-sm text-base-content/60 mt-1">Manage and balance tasks across the team</p>
        </div>
        
        <div className="flex items-center gap-4 bg-base-100 p-2 rounded-lg border border-base-300 shadow-sm">
          {Object.entries(CAPACITY_LABELS).map(([key, label]) => {
            const colorClass = CAPACITY_COLORS[key as keyof typeof CAPACITY_COLORS]
            return (
              <div key={key} className="flex items-center gap-2 text-xs font-medium">
                <span className={`w-3 h-3 rounded-full ${colorClass}`} />
                {label}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {members.length === 0 ? (
          <div className="text-center py-12 text-base-content/50 border-2 border-dashed border-base-300 rounded-xl">
            No team members found with assigned tasks.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map(member => (
              <div key={member.id} className="flex flex-col">
                <WorkloadBar
                  member={member}
                  isExpanded={expandedMemberId === member.id}
                  onToggle={() => handleToggleMember(member.id)}
                  onCardClick={handleCardClick}
                />
                {expandedMemberId === member.id && (
                  <div className="pl-14 mb-4">
                    {!memberCards[member.id] ? (
                      <div className="p-4 text-center"><span className="loading loading-dots loading-sm"></span></div>
                    ) : (
                      <WorkloadCardList 
                        cards={memberCards[member.id]} 
                        onCardClick={handleCardClick} 
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
