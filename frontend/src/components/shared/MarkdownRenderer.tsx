import ReactMarkdown from 'react-markdown'
import { useBoardStore } from '../../stores/boardStore'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function preprocessMentions(text: string): string {
  if (!text) return ''

  // Match user emails: @email@domain.com
  let result = text.replace(
    /(\s|^)@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g,
    '$1[@$2](mention-user://$2)',
  )

  // Match simple usernames: @username (excluding already-matched emails)
  result = result.replace(
    /(\s|^)@([a-zA-Z0-9._-]+)(?![a-zA-Z0-9._-]*@)/g,
    '$1[@$2](mention-user://$2)',
  )

  // Match card ID mentions: #12
  result = result.replace(/(\s|^)#(\d+)/g, '$1[#$2](mention-card://$2)')

  return result
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const setActiveCardId = useBoardStore((s) => s.setActiveCardId)

  const preprocessed = preprocessMentions(content)

  const components = {
    // biome-ignore lint/suspicious/noExplicitAny: library component typing is dynamic
    a: ({ href, children }: any) => {
      if (href?.startsWith('mention-card://')) {
        const cardId = href.replace('mention-card://', '')
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setActiveCardId(Number(cardId))
            }}
            className="badge badge-primary font-bold cursor-pointer hover:scale-105 active:scale-95 transition-transform inline-flex items-center gap-0.5 mx-0.5 py-2"
          >
            📄 #{cardId}
          </button>
        )
      }
      if (href?.startsWith('mention-user://')) {
        const user = href.replace('mention-user://', '')
        return (
          <span className="badge badge-secondary font-bold inline-flex items-center gap-0.5 mx-0.5 py-2">
            👤 @{user}
          </span>
        )
      }
      return (
        <a href={href} className="text-primary hover:underline" target="_blank" rel="noreferrer">
          {children}
        </a>
      )
    },
  }

  return (
    <div className={`prose prose-sm max-w-none text-left leading-relaxed ${className}`}>
      <ReactMarkdown components={components}>{preprocessed}</ReactMarkdown>
    </div>
  )
}
