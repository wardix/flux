import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Activity {
  id: number
  card_id: number
  user_id: number | null
  action: string
  details?: string | null
  created_at: string
  user_email?: string | null
  user_avatar?: string | null
}

interface CardActivitiesProps {
  cardId: number
  refreshTrigger?: number
}

export function CardActivities({ cardId, refreshTrigger }: CardActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([])

  const fetchActivities = async () => {
    try {
      const res = await api.get<Activity[]>(`/cards/${cardId}/activities`)
      setActivities(res)
    } catch (err) {
      console.error('Failed to fetch activity logs:', err)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchActivities is not memoized
  useEffect(() => {
    fetchActivities()
  }, [cardId, refreshTrigger])

  const translateAction = (action: string, details?: string | null) => {
    switch (action) {
      case 'created':
        return 'membuat card'
      case 'updated_title':
        return `mengubah judul menjadi "${details}"`
      case 'updated_description':
        return 'memperbarui deskripsi card'
      case 'updated_due_date':
        return `mengubah tenggat waktu menjadi ${details ? new Date(details).toLocaleDateString() : 'dihapus'}`
      case 'updated_story_points':
        return `mengubah story points menjadi ${details}`
      case 'moved_list':
        return 'memindahkan card'
      case 'updated_assignee':
        return `mengubah assignee menjadi ${details}`
      case 'archived':
        return 'mengarsipkan card'
      case 'restored':
        return 'memulihkan card dari arsip'
      case 'deleted':
        return 'memindahkan card ke tempat sampah'
      case 'added_comment':
        return `menambahkan komentar: "${details}"`
      default:
        return action
    }
  }

  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : '?'
  }

  return (
    <div className="space-y-3">
      {activities.length > 0 ? (
        <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
          {activities.map((act) => {
            const userDisplay = act.user_email || 'Sistem'
            return (
              <div key={act.id} className="flex items-start gap-2.5">
                {/* User mini avatar */}
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-6 h-6 font-semibold text-[10px] flex items-center justify-center shadow-inner">
                    {act.user_avatar ? (
                      <img src={act.user_avatar} alt="avatar" />
                    ) : (
                      <span>{getInitials(userDisplay)}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-base-content/85">
                    <span className="font-bold mr-1">{userDisplay}</span>
                    <span className="text-base-content/65">
                      {translateAction(act.action, act.details)}
                    </span>
                  </div>
                  <div className="text-[9px] text-base-content/40 font-medium">
                    {new Date(act.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-xs text-base-content/40 py-2">
          Belum ada riwayat aktivitas.
        </div>
      )}
    </div>
  )
}
