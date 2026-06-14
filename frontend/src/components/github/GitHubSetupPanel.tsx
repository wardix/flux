import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { GithubInstallation, List } from '../../lib/types'
import { GitBranch, Loader2 } from 'lucide-react'

interface Props {
  boardId: number
  lists: List[]
  disabled?: boolean
}

export function GitHubSetupPanel({ boardId, lists, disabled }: Props) {
  const [installation, setInstallation] = useState<GithubInstallation | null>(null)
  const [repoFullName, setRepoFullName] = useState('')
  const [inProgressListId, setInProgressListId] = useState<number | ''>('')
  const [reviewListId, setReviewListId] = useState<number | ''>('')
  const [doneListId, setDoneListId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null)

  useEffect(() => {
    loadInstallation()
  }, [boardId])

  const loadInstallation = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ installation: GithubInstallation | null; webhook_secret?: string }>(`/boards/${boardId}/github`)
      if (res.installation) {
        setInstallation(res.installation)
        setRepoFullName(res.installation.repo_full_name)
        setInProgressListId(res.installation.in_progress_list_id || '')
        setReviewListId(res.installation.review_list_id || '')
        setDoneListId(res.installation.done_list_id || '')
        setWebhookSecret(res.webhook_secret || null)
      } else {
        setInstallation(null)
      }
    } catch (err) {
      console.error('Failed to load GitHub installation', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoFullName.trim() || disabled) return
    try {
      setSaving(true)
      const payload = {
        repo_full_name: repoFullName,
        in_progress_list_id: inProgressListId === '' ? null : Number(inProgressListId),
        review_list_id: reviewListId === '' ? null : Number(reviewListId),
        done_list_id: doneListId === '' ? null : Number(doneListId)
      }
      
      const res = await api.post<{ installation: GithubInstallation; webhook_secret?: string }>(`/boards/${boardId}/github`, payload)
      setInstallation(res.installation)
      if (res.webhook_secret) {
        setWebhookSecret(res.webhook_secret)
      }
    } catch (err) {
      console.error('Failed to save GitHub installation', err)
      alert('Failed to save GitHub setup')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (disabled || !installation) return
    if (!confirm('Are you sure you want to remove GitHub integration?')) return
    try {
      setSaving(true)
      await api.delete(`/boards/${boardId}/github`)
      setInstallation(null)
      setRepoFullName('')
      setInProgressListId('')
      setReviewListId('')
      setDoneListId('')
      setWebhookSecret(null)
    } catch (err) {
      console.error('Failed to remove GitHub installation', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="flex flex-col gap-4">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <GitBranch size={20} />
          GitHub Integration
      </h3>
      
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <div className="form-control">
          <label className="label py-1"><span className="label-text">Repository (owner/repo)</span></label>
          <input 
            type="text" 
            className="input input-sm input-bordered"
            placeholder="e.g. facebook/react"
            value={repoFullName}
            onChange={e => setRepoFullName(e.target.value)}
            disabled={disabled}
            required
          />
        </div>

        <div className="form-control">
          <label className="label py-1"><span className="label-text">In Progress List (Branch created)</span></label>
          <select 
            className="select select-sm select-bordered"
            value={inProgressListId}
            onChange={(e) => setInProgressListId(e.target.value ? Number(e.target.value) : '')}
            disabled={disabled}
          >
            <option value="">-- None --</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>

        <div className="form-control">
          <label className="label py-1"><span className="label-text">Review List (PR opened)</span></label>
          <select 
            className="select select-sm select-bordered"
            value={reviewListId}
            onChange={(e) => setReviewListId(e.target.value ? Number(e.target.value) : '')}
            disabled={disabled}
          >
            <option value="">-- None --</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>

        <div className="form-control">
          <label className="label py-1"><span className="label-text">Done List (PR merged)</span></label>
          <select 
            className="select select-sm select-bordered"
            value={doneListId}
            onChange={(e) => setDoneListId(e.target.value ? Number(e.target.value) : '')}
            disabled={disabled}
          >
            <option value="">-- None --</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>

        <div className="flex gap-2 justify-end mt-2">
          {installation && (
            <button 
              type="button" 
              className="btn btn-sm btn-error btn-outline" 
              onClick={handleDelete}
              disabled={disabled || saving}
            >
              Remove
            </button>
          )}
          <button 
            type="submit" 
            className="btn btn-sm btn-primary"
            disabled={disabled || saving}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </div>
      </form>

      {installation && webhookSecret && (
        <div className="mt-2 p-3 bg-base-300 rounded-lg text-sm break-all">
          <p className="font-semibold mb-1">Webhook Secret:</p>
          <code className="bg-base-100 p-1 rounded select-all">{webhookSecret}</code>
          <p className="text-xs text-base-content/70 mt-2">
            Configure this secret in your GitHub repository webhooks settings.
            Webhook URL: <code>{window.location.origin}/api/webhooks/github</code>
          </p>
        </div>
      )}
    </div>
  )
}
