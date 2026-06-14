import React from 'react'
import { Sparkles } from 'lucide-react'

interface AISettingsToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export const AISettingsToggle: React.FC<AISettingsToggleProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-xl">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            AI Smart Suggestions
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
            Enable AI-powered card summarizing, label categorization, and team member assignments.
          </p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
      </label>
    </div>
  )
}
export default AISettingsToggle
