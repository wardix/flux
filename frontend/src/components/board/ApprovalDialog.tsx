import { useState } from 'react'
import type { ApprovalRuleWithVotes } from '../../lib/types'
import { api } from '../../lib/api'
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

interface ApprovalDialogProps {
  cardId: number
  rule: ApprovalRuleWithVotes
  onClose: () => void
  onVoteComplete: () => void
}

export function ApprovalDialog({ cardId, rule, onClose, onVoteComplete }: ApprovalDialogProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const user = useAuthStore(s => s.user)
  const hasVoted = rule.votes.some(v => v.user_id === user?.id)

  const handleVote = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true)
    setError(null)
    try {
      await api.post(`/cards/${cardId}/approval/vote`, {
        rule_id: rule.id,
        status,
        comment: comment.trim() || null
      })
      onVoteComplete()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="font-bold text-lg mb-2">Approval Request</h3>
        <p className="text-sm text-base-content/70 mb-4">
          Move from <strong>{rule.from_list}</strong> to <strong>{rule.to_list}</strong>
          <br />
          Requires {rule.min_approvals} approval(s).
        </p>

        {error && (
          <div className="alert alert-error text-sm mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
          {rule.votes.length === 0 ? (
            <p className="text-sm italic text-base-content/50">No votes yet.</p>
          ) : (
            rule.votes.map((vote, i) => (
              <div key={i} className="bg-base-200 p-3 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{vote.name}</span>
                  <span className={`badge badge-sm ${vote.status === 'approved' ? 'badge-success' : 'badge-error'} text-white`}>
                    {vote.status}
                  </span>
                </div>
                {vote.comment && (
                  <div className="flex gap-2 text-base-content/70 mt-2 bg-base-100 p-2 rounded">
                    <MessageSquare size={14} className="shrink-0 mt-0.5" />
                    <p className="italic">"{vote.comment}"</p>
                  </div>
                )}
                <div className="text-[10px] text-base-content/40 mt-2 text-right">
                  {new Date(vote.voted_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {!hasVoted && (
          <div className="space-y-3 border-t border-base-200 pt-4">
            <div>
              <label className="text-xs font-semibold uppercase text-base-content/50 mb-1 block">
                Comment (Optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full text-sm"
                placeholder="Why are you approving/rejecting?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-error flex-1 text-white" 
                onClick={() => handleVote('rejected')}
                disabled={isSubmitting}
              >
                <XCircle size={18} />
                Reject
              </button>
              <button 
                className="btn btn-success flex-1 text-white"
                onClick={() => handleVote('approved')}
                disabled={isSubmitting}
              >
                <CheckCircle2 size={18} />
                Approve
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            {hasVoted ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
