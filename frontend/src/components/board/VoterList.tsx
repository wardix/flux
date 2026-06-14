import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Voter, Card } from '../../lib/types'

interface VoterListProps {
  card: Card
}

export function VoterList({ card }: VoterListProps) {
  const [voters, setVoters] = useState<Voter[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchVoters = async () => {
    setIsLoading(true)
    try {
      const res = await api.get<{ data: { voters: Voter[] } }>(`/cards/${card.id}/votes`)
      setVoters(res.data.voters)
    } catch (err) {
      console.error('Failed to fetch voters:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVoters()
  }, [card.id, card.vote_count])

  if (voters.length === 0) {
    return (
      <div className="text-xs text-base-content/50 italic py-1">
        No votes yet. Be the first to vote!
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?'
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-base-content/75 uppercase tracking-wider">
        Voters ({voters.length})
      </h4>
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
        {voters.map((voter) => (
          <div
            key={voter.id}
            className="flex items-center gap-1.5 bg-base-200 hover:bg-base-300 dark:bg-base-800 dark:hover:bg-base-700/80 px-2 py-1 rounded-full text-xs transition-colors"
            title={`Voted on ${new Date(voter.voted_at).toLocaleString()}`}
          >
            {voter.avatar_url ? (
              <img
                src={voter.avatar_url}
                alt={voter.name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                {getInitials(voter.name)}
              </div>
            )}
            <span className="font-medium truncate max-w-[120px]">
              {voter.name}
            </span>
          </div>
        ))}
      </div>
      {isLoading && voters.length > 0 && (
        <span className="loading loading-spinner loading-xs text-base-content/30 block"></span>
      )}
    </div>
  )
}
