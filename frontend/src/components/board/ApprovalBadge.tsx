import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { ApprovalRuleWithVotes } from '../../lib/types'

interface ApprovalBadgeProps {
  status: ApprovalRuleWithVotes
}

export function ApprovalBadge({ status }: ApprovalBadgeProps) {
  if (status.is_approved) {
    return (
      <div className="badge badge-success badge-sm gap-1 text-white">
        <CheckCircle2 size={12} />
        Approved ({status.approvals_received}/{status.min_approvals})
      </div>
    )
  }

  if (status.rejections > 0) {
    return (
      <div className="badge badge-error badge-sm gap-1 text-white">
        <XCircle size={12} />
        Rejected ({status.rejections})
      </div>
    )
  }

  return (
    <div className="badge badge-warning badge-sm gap-1">
      <Clock size={12} />
      Pending ({status.approvals_received}/{status.min_approvals})
    </div>
  )
}
