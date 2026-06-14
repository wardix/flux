import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import type { AISuggestionResult } from '../../lib/types'

interface AISuggestButtonProps {
  type: 'labels' | 'summarize' | 'assignee'
  cardId: number
  payload: Record<string, any>
  onSuggestion: (result: AISuggestionResult) => void
  disabled?: boolean
}

export const AISuggestButton: React.FC<AISuggestButtonProps> = ({
  type,
  cardId,
  payload,
  onSuggestion,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchSuggestion = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    setError(null)
    try {
      let endpoint = ''
      let requestBody: Record<string, any> = { card_id: cardId }

      if (type === 'labels') {
        endpoint = '/ai/suggest-labels'
        requestBody = {
          card_id: cardId,
          title: payload.title,
          description: payload.description,
          available_labels: payload.available_labels,
        }
      } else if (type === 'summarize') {
        endpoint = '/ai/summarize'
        requestBody = { card_id: cardId }
      } else if (type === 'assignee') {
        endpoint = '/ai/suggest-assignee'
        requestBody = {
          card_id: cardId,
          title: payload.title,
          description: payload.description,
          available_members: payload.available_members,
        }
      }

      const { data } = await api.post<{ data: any }>(endpoint, requestBody)
      onSuggestion({
        type,
        data: data.data,
      })
    } catch (err: any) {
      console.error('Failed to get AI suggestions:', err)
      setError(err.response?.data?.error || 'AI service unavailable')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const labelMap = {
    labels: 'Auto-Label',
    summarize: 'AI Summary',
    assignee: 'Auto-Assign',
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleFetchSuggestion}
        disabled={disabled || loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border shadow-sm ${
          loading
            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
            : 'bg-white dark:bg-neutral-900 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 hover:border-violet-300 dark:hover:border-violet-700'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
        )}
        <span>{loading ? 'Processing...' : labelMap[type]}</span>
      </button>
      {error && (
        <div className="absolute z-50 top-full mt-1.5 right-0 w-64 p-2.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg shadow-md animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
    </div>
  )
}
