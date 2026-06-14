import type { Card } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'

interface VoteButtonProps {
  card: Card
}

export function VoteButton({ card }: VoteButtonProps) {
  const toggleVote = useBoardStore((state) => state.toggleVote)
  const userRole = useBoardStore((state) => state.userRole)
  const isObserver = userRole === 'observer'

  const voteCount = card.vote_count || 0
  const userVoted = !!card.user_voted

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isObserver) return
    await toggleVote(card.id)
  }

  return (
    <button
      onClick={handleVote}
      disabled={isObserver}
      className={`btn btn-sm gap-2 transition-all duration-200 ${
        userVoted
          ? 'btn-primary shadow-sm hover:scale-105'
          : 'btn-outline border-base-300 hover:bg-base-200 hover:scale-105'
      } ${isObserver ? 'opacity-65 cursor-not-allowed' : ''}`}
      title={
        isObserver ? 'Observers cannot vote' : userVoted ? 'Remove vote' : 'Vote for this card'
      }
    >
      <span className="text-base">👍</span>
      <span className="font-semibold">{voteCount}</span>
      <span>{userVoted ? 'Voted' : 'Vote'}</span>
    </button>
  )
}
