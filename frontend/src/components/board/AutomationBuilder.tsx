import { useState } from 'react'
import type { List, Label } from '../../lib/types'

interface AutomationBuilderProps {
  lists: List[]
  labels: Label[]
  members: any[]
  onSave: (data: {
    name: string
    description?: string | null
    trigger_event: 'card_created' | 'card_moved' | 'card_assigned' | 'due_date_reached'
    trigger_config: Record<string, any>
    action_type: 'move_card' | 'assign_user' | 'add_label' | 'send_notification'
    action_config: Record<string, any>
  }) => Promise<void>
  onCancel: () => void
  initialRule?: any
}

export function AutomationBuilder({
  lists,
  labels,
  members,
  onSave,
  onCancel,
  initialRule,
}: AutomationBuilderProps) {
  const [name, setName] = useState(initialRule?.name || '')
  const [description, setDescription] = useState(initialRule?.description || '')
  const [triggerEvent, setTriggerEvent] = useState<
    'card_created' | 'card_moved' | 'card_assigned' | 'due_date_reached'
  >(initialRule?.trigger_event || 'card_created')
  const [actionType, setActionType] = useState<
    'move_card' | 'assign_user' | 'add_label' | 'send_notification'
  >(initialRule?.action_type || 'move_card')

  // Trigger Config state
  const [toListId, setToListId] = useState(
    initialRule?.trigger_config?.to_list_id || (lists[0]?.id ? String(lists[0].id) : '')
  )

  // Action Config state
  const [actionListId, setActionListId] = useState(
    initialRule?.action_config?.list_id || (lists[0]?.id ? String(lists[0].id) : '')
  )
  const [actionUserId, setActionUserId] = useState(
    initialRule?.action_config?.user_id || (members[0]?.user_id ? String(members[0].user_id) : '')
  )
  const [actionLabelId, setActionLabelId] = useState(
    initialRule?.action_config?.label_id || (labels[0]?.id ? String(labels[0].id) : '')
  )
  const [actionMessage, setActionMessage] = useState(initialRule?.action_config?.message || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setSaving(true)

    // Build configs
    const triggerConfig: Record<string, any> = {}
    if (triggerEvent === 'card_moved') {
      if (!toListId) {
        setError('Trigger target list is required')
        setSaving(false)
        return
      }
      triggerConfig.to_list_id = Number(toListId)
    }

    const actionConfig: Record<string, any> = {}
    if (actionType === 'move_card') {
      if (!actionListId) {
        setError('Action destination list is required')
        setSaving(false)
        return
      }
      actionConfig.list_id = Number(actionListId)
    } else if (actionType === 'assign_user') {
      if (!actionUserId) {
        setError('Action assignee user is required')
        setSaving(false)
        return
      }
      actionConfig.user_id = Number(actionUserId)
    } else if (actionType === 'add_label') {
      if (!actionLabelId) {
        setError('Action label is required')
        setSaving(false)
        return
      }
      actionConfig.label_id = Number(actionLabelId)
    } else if (actionType === 'send_notification') {
      if (!actionUserId) {
        setError('Notification recipient is required')
        setSaving(false)
        return
      }
      if (!actionMessage.trim()) {
        setError('Notification message is required')
        setSaving(false)
        return
      }
      actionConfig.user_id = Number(actionUserId)
      actionConfig.message = actionMessage.trim()
    }

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        trigger_event: triggerEvent,
        trigger_config: triggerConfig,
        action_type: actionType,
        action_config: actionConfig,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to save automation rule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-base-100 p-4 rounded-xl border border-base-200 shadow-lg">
      <div className="flex justify-between items-center pb-2 border-b border-base-200">
        <h4 className="font-bold text-sm text-primary uppercase">
          {initialRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
        </h4>
        <button type="button" onClick={onCancel} className="btn btn-xs btn-ghost">
          ✕
        </button>
      </div>

      {error && (
        <div className="alert alert-error text-xs py-2 rounded">
          <span>{error}</span>
        </div>
      )}

      <div className="form-control">
        <label className="label py-0.5">
          <span className="label-text text-xs font-semibold">Rule Name</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Move to Done → Add Label Completed"
          className="input input-sm input-bordered w-full font-medium"
          required
        />
      </div>

      <div className="form-control">
        <label className="label py-0.5">
          <span className="label-text text-xs font-semibold">Description (Optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this rule do..."
          className="textarea textarea-sm textarea-bordered w-full h-14"
        />
      </div>

      {/* WHEN - Trigger Section */}
      <div className="card bg-base-200/50 p-3 border border-base-300 rounded-lg space-y-2">
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
          ⚡ WHEN (Trigger)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label py-0.5">
              <span className="label-text text-xs">Event</span>
            </label>
            <select
              value={triggerEvent}
              onChange={(e) => {
                setTriggerEvent(e.target.value as any)
                setError(null)
              }}
              className="select select-sm select-bordered w-full"
            >
              <option value="card_created">Card is created</option>
              <option value="card_moved">Card is moved</option>
              <option value="card_assigned">Card is assigned</option>
              <option value="due_date_reached">Due date is reached</option>
            </select>
          </div>

          {triggerEvent === 'card_moved' && (
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">Moved to column</span>
              </label>
              <select
                value={toListId}
                onChange={(e) => setToListId(e.target.value)}
                className="select select-sm select-bordered w-full"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* THEN - Action Section */}
      <div className="card bg-base-200/50 p-3 border border-base-300 rounded-lg space-y-2">
        <span className="text-xs font-bold text-success uppercase tracking-wide">
          👉 THEN (Action)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label py-0.5">
              <span className="label-text text-xs">Action Type</span>
            </label>
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value as any)
                setError(null)
              }}
              className="select select-sm select-bordered w-full"
            >
              <option value="move_card">Move card to list</option>
              <option value="assign_user">Assign user to card</option>
              <option value="add_label">Add label to card</option>
              <option value="send_notification">Send notification/comment</option>
            </select>
          </div>

          {actionType === 'move_card' && (
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">Destination Column</span>
              </label>
              <select
                value={actionListId}
                onChange={(e) => setActionListId(e.target.value)}
                className="select select-sm select-bordered w-full"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'assign_user' && (
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">User</span>
              </label>
              <select
                value={actionUserId}
                onChange={(e) => setActionUserId(e.target.value)}
                className="select select-sm select-bordered w-full"
              >
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'add_label' && (
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">Label</span>
              </label>
              <select
                value={actionLabelId}
                onChange={(e) => setActionLabelId(e.target.value)}
                className="select select-sm select-bordered w-full"
              >
                {labels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'send_notification' && (
            <>
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-xs">Recipient User</span>
                </label>
                <select
                  value={actionUserId}
                  onChange={(e) => setActionUserId(e.target.value)}
                  className="select select-sm select-bordered w-full"
                >
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control md:col-span-2">
                <label className="label py-0.5">
                  <span className="label-text text-xs">Comment Message</span>
                </label>
                <input
                  type="text"
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder="Notification comment content..."
                  className="input input-sm input-bordered w-full font-medium"
                  required
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
        <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn btn-sm btn-primary text-white">
          {saving ? 'Saving...' : 'Save Automation'}
        </button>
      </div>
    </form>
  )
}
