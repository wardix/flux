import React from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
import type { AISuggestionResult } from '../../lib/types'

interface AISuggestionPanelProps {
  suggestions: AISuggestionResult
  onAccept: (item: any) => void
  onReject?: (item: any) => void
  onDismiss: () => void
}

export const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  suggestions,
  onAccept,
  onReject,
  onDismiss,
}) => {
  const { type, data } = suggestions

  if (!data) return null

  return (
    <div className="mt-3 p-4 bg-gradient-to-br from-violet-50/50 to-indigo-50/30 dark:from-violet-950/10 dark:to-indigo-950/5 border border-violet-100 dark:border-violet-900/40 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-violet-100/50 dark:border-violet-900/20">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-bold">✨</span>
          <h4 className="text-xs font-semibold text-violet-950 dark:text-violet-300">
            {type === 'labels' && 'AI Label Suggestions'}
            {type === 'summarize' && 'AI Content Summary'}
            {type === 'assignee' && 'AI Assignee Recommendation'}
          </h4>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {type === 'labels' && data.suggested_labels && (
        <div className="space-y-2.5">
          {data.suggested_labels.length === 0 ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> No matching labels recommended.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.suggested_labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white dark:bg-neutral-900 border border-violet-200/50 dark:border-violet-800/30 rounded-full shadow-sm text-xs"
                >
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {label.name}
                  </span>
                  <span className="text-[10px] text-violet-500 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded-full">
                    {Math.round(label.confidence * 100)}%
                  </span>
                  <div className="flex items-center gap-0.5 ml-1 border-l border-neutral-100 dark:border-neutral-800 pl-1">
                    <button
                      type="button"
                      onClick={() => onAccept(label)}
                      className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-full transition-colors"
                      title="Apply Label"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    {onReject && (
                      <button
                        type="button"
                        onClick={() => onReject(label)}
                        className="p-0.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
                        title="Dismiss Suggestion"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.reasoning && (
            <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 italic mt-1.5">
              &ldquo;{data.reasoning}&rdquo;
            </p>
          )}
        </div>
      )}

      {type === 'summarize' && (
        <div className="space-y-2.5">
          <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            {data.summary || 'No summary generated.'}
          </p>
          {data.key_points && data.key_points.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-violet-100/50 dark:border-violet-900/20">
              <span className="text-[10px] uppercase tracking-wider font-bold text-violet-500 dark:text-violet-400 block mb-1">Key Points</span>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                {data.key_points.map((point: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {type === 'assignee' && data.suggested_assignees && (
        <div className="space-y-2.5">
          {data.suggested_assignees.length === 0 ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> No assignees recommended.
            </p>
          ) : (
            <div className="space-y-2">
              {data.suggested_assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-start justify-between gap-3 p-2.5 bg-white dark:bg-neutral-900 border border-violet-200/40 dark:border-violet-800/20 rounded-lg shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {assignee.name}
                      </span>
                      <span className="text-[9px] font-bold text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded-full">
                        {Math.round(assignee.confidence * 100)}% Match
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {assignee.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAccept(assignee)}
                    className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-[10px] font-medium shadow-sm transition-colors"
                  >
                    <Check className="w-3 h-3" /> Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
