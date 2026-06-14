import type React from 'react'
import { useState } from 'react'

interface SubtaskAddFormProps {
  onSubmit: (title: string) => void
  onCancel: () => void
}

export function SubtaskAddForm({ onSubmit, onCancel }: SubtaskAddFormProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim())
      setTitle('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full mt-2">
      <input
        type="text"
        placeholder="Add a subtask..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        // biome-ignore lint/a11y/noAutofocus: autofocus is required for subtask inline add input
        autoFocus
        className="input input-sm input-bordered flex-1 focus:outline-none focus:input-primary text-xs"
      />
      <button type="submit" className="btn btn-primary btn-xs">
        Add
      </button>
      <button type="button" onClick={onCancel} className="btn btn-ghost btn-xs">
        Cancel
      </button>
    </form>
  )
}
