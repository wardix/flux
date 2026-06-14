import type { Card } from '../../lib/types'
import { GitHubLinkBadge } from './GitHubLinkBadge'
import { GitBranch } from 'lucide-react'

interface Props {
  card: Card
}

export function GitHubLinksSection({ card }: Props) {
  const links = card.github_links || []

  if (links.length === 0) return null

  const branches = links.filter(l => l.type === 'branch')
  const prs = links.filter(l => l.type === 'pull_request')

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-base-content/90 flex items-center gap-2 mb-3">
        <GitBranch size={16} /> GitHub Links
      </h3>
      <div className="flex flex-wrap gap-2">
        {branches.map(b => <GitHubLinkBadge key={b.id} link={b} />)}
        {prs.map(p => <GitHubLinkBadge key={p.id} link={p} />)}
      </div>
    </div>
  )
}
