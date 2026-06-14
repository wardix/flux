import type { GithubLink } from '../../lib/types'
import { GitBranch, GitPullRequest } from 'lucide-react'

export function GitHubLinkBadge({ link }: { link: GithubLink }) {
  const isBranch = link.type === 'branch'
  const isPR = link.type === 'pull_request'
  const isMerged = link.state === 'merged'
  const isClosed = link.state === 'closed'
  const isOpen = link.state === 'open'

  let icon = null
  let bgColor = 'bg-gray-100 text-gray-700'

  if (isBranch) {
    icon = <GitBranch size={14} className="mr-1" />
    bgColor = 'bg-blue-100 text-blue-700'
  } else if (isPR) {
    icon = <GitPullRequest size={14} className="mr-1" />
    if (isMerged) bgColor = 'bg-purple-100 text-purple-700'
    else if (isOpen) bgColor = 'bg-green-100 text-green-700'
    else if (isClosed) bgColor = 'bg-red-100 text-red-700'
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium hover:opacity-80 transition-opacity ${bgColor}`}
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      {isPR ? `#${link.github_id}` : link.title}
    </a>
  )
}
