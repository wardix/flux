import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface PublicFormSettingsProps {
  boardId: number
  disabled?: boolean
}

interface PublicFormConfig {
  id: number
  board_id: number
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function PublicFormSettings({ boardId, disabled }: PublicFormSettingsProps) {
  const [isActive, setIsActive] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formId, setFormId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    const fetchConfig = async () => {
      setLoading(true)
      try {
        const res = await api.get<{ data: PublicFormConfig | null }>(`/boards/${boardId}/form`)
        if (res.data && active) {
          setIsActive(res.data.is_active)
          setTitle(res.data.title)
          setDescription(res.data.description || '')
          setFormId(res.data.id)
        } else if (active) {
          setIsActive(false)
          setTitle('Submit Feedback')
          setDescription('')
          setFormId(null)
        }
      } catch (err) {
        console.error('Failed to load public form configuration:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchConfig()
    return () => {
      active = false
    }
  }, [boardId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    setSaving(true)
    try {
      const res = await api.post<{ data: PublicFormConfig }>(`/boards/${boardId}/form`, {
        title,
        description: description || null,
        is_active: isActive,
      })
      if (res.data) {
        setIsActive(res.data.is_active)
        setTitle(res.data.title)
        setDescription(res.data.description || '')
        setFormId(res.data.id)
      }
    } catch (err) {
      console.error('Failed to save public form configuration:', err)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const shareUrl = formId ? `${window.location.origin}/#/public/forms/${formId}` : ''

  const copyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div className="text-center p-4"><span className="loading loading-spinner loading-sm text-primary"></span> Loading...</div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 text-left p-1">
      <div className="flex items-center justify-between border-b border-base-200 pb-2">
        <span className="text-xs font-bold text-base-content/75 uppercase tracking-wide flex items-center gap-1">
          📋 Public Form Settings
        </span>
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3 p-0">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={disabled}
            className="toggle toggle-primary toggle-sm"
          />
          <span className="label-text font-medium text-xs">Enable Public Form</span>
        </label>
        <p className="text-[10px] text-base-content/50 mt-1">
          Allow external users (who are not logged in) to submit cards directly to this board.
        </p>
      </div>

      <div className="space-y-3">
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-xs font-semibold">Form Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled}
            placeholder="e.g. Feedback Form"
            className="input input-xs input-bordered w-full focus:outline-none"
            required
          />
        </div>

        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-xs font-semibold">Form Description</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            placeholder="Describe what this form is for..."
            className="textarea textarea-xs textarea-bordered w-full h-16 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || disabled}
          className="btn btn-primary btn-xs w-full text-white"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {isActive && formId && (
        <div className="pt-3 border-t border-base-250 space-y-2">
          <label className="label py-0">
            <span className="label-text text-[10px] font-bold text-base-content/50 uppercase">Shareable Link</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="input input-xs input-bordered flex-1 text-xs select-all bg-base-200/50"
            />
            <button
              type="button"
              onClick={copyLink}
              className={`btn btn-xs ${copied ? 'btn-success text-white' : 'btn-outline btn-primary'}`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
