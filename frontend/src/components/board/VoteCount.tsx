import type { Card } from '../../lib/types'

interface VoteCountProps {
  card: Card
}

export function VoteCount({ card }: VoteCountProps) {
  const voteCount = card.vote_count || 0
  const userVoted = !!card.user_voted

  if (voteCount === 0) return null

  return (
    <div
      className={`badge badge-sm gap-1 py-2 px-1.5 transition-all duration-200 border ${
        userVoted
          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50'
          : 'badge-ghost border-base-300'
      }`}
      title={userVoted ? 'You voted for this card' : `${voteCount} votes`}
    >
      <span>👍</span>
      <span className="font-semibold">{voteCount}</span>
    </div>
  )
}
