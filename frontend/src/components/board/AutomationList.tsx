import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { AutomationRule, List, Label } from '../../lib/types'
import { AutomationBuilder } from './AutomationBuilder'

interface AutomationListProps {
  boardId: number
  lists: List[]
  labels: Label[]
  members: any[]
  disabled?: boolean
}

export function AutomationList({
  boardId,
  lists,
  labels,
  members,
  disabled = false,
}: AutomationListProps) {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  const fetchRules = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ data: AutomationRule[] }>(`/boards/${boardId}/automations`)
      setRules(res.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch automation rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [boardId])

  const handleToggle = async (ruleId: number, enabled: boolean) => {
    setError(null)
    try {
      await api.put(`/boards/${boardId}/automations/${ruleId}`, { is_enabled: enabled })
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_enabled: enabled } : r))
      )
    } catch (err: any) {
      setError(err.message || 'Failed to toggle rule state')
    }
  }

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return
    setError(null)
    try {
      await api.delete(`/boards/${boardId}/automations/${ruleId}`)
      setRules((prev) => prev.filter((r) => r.id !== ruleId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete rule')
    }
  }

  const handleSave = async (data: any) => {
    setError(null)
    try {
      if (editingRule) {
        await api.put(`/boards/${boardId}/automations/${editingRule.id}`, data)
      } else {
        await api.post(`/boards/${boardId}/automations`, data)
      }
      setIsBuilding(false)
      setEditingRule(null)
      fetchRules()
    } catch (err: any) {
      setError(err.message || 'Failed to save automation rule')
      throw err
    }
  }

  const getRuleSummary = (rule: AutomationRule) => {
    let whenStr = ''
    if (rule.trigger_event === 'card_created') whenStr = 'Card is created'
    else if (rule.trigger_event === 'card_moved') {
      const list = lists.find((l) => l.id === Number(rule.trigger_config?.to_list_id))
      whenStr = `Card is moved to "${list?.title || 'Unknown column'}"`
    } else if (rule.trigger_event === 'card_assigned') whenStr = 'Card is assigned'
    else if (rule.trigger_event === 'due_date_reached') whenStr = 'Due date is reached'

    let thenStr = ''
    if (rule.action_type === 'move_card') {
      const list = lists.find((l) => l.id === Number(rule.action_config?.list_id))
      thenStr = `Move card to "${list?.title || 'Unknown Column'}"`
    } else if (rule.action_type === 'assign_user') {
      const user = members.find((m) => m.user_id === Number(rule.action_config?.user_id))
      thenStr = `Assign to ${user?.email || 'Unknown User'}`
    } else if (rule.action_type === 'add_label') {
      const label = labels.find((l) => l.id === Number(rule.action_config?.label_id))
      thenStr = `Add label "${label?.name || 'Unknown label'}"`
    } else if (rule.action_type === 'send_notification') {
      const user = members.find((m) => m.user_id === Number(rule.action_config?.user_id))
      thenStr = `Send notification to ${user?.email || 'Unknown User'}`
    }

    return (
      <div className="flex flex-col text-xs text-base-content/70 mt-1 space-y-0.5">
        <div>
          <span className="font-semibold text-indigo-500">WHEN:</span> {whenStr}
        </div>
        <div>
          <span className="font-semibold text-success">THEN:</span> {thenStr}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert alert-error text-xs py-2 rounded">
          <span>{error}</span>
        </div>
      )}

      {isBuilding || editingRule ? (
        <AutomationBuilder
          lists={lists}
          labels={labels}
          members={members}
          onSave={handleSave}
          onCancel={() => {
            setIsBuilding(false)
            setEditingRule(null)
          }}
          initialRule={editingRule}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">
              Automation Rules
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={() => setIsBuilding(true)}
                className="btn btn-primary btn-xs text-white"
              >
                + Create Automation
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-xs text-base-content/50">Loading rules...</div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="card bg-base-100 border border-base-200 shadow-sm p-3 rounded-xl hover:shadow-md transition-shadow relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="pr-12">
                      <span className="font-bold text-sm text-base-content/90 block leading-tight">
                        {rule.name}
                      </span>
                      {rule.description && (
                        <span className="text-[11px] text-base-content/50 block mt-0.5">
                          {rule.description}
                        </span>
                      )}
                      {getRuleSummary(rule)}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-base-content/40">
                        <span>Runs: {rule.execution_count}</span>
                        {rule.last_executed_at && (
                          <span>
                            • Last Run:{' '}
                            {new Date(rule.last_executed_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rule.is_enabled}
                        disabled={disabled}
                        onChange={(e) => handleToggle(rule.id, e.target.checked)}
                        className="toggle toggle-xs toggle-primary"
                        aria-label="Toggle enable/disable automation"
                      />
                      {!disabled && (
                        <div className="dropdown dropdown-end">
                          <button
                            type="button"
                            tabIndex={0}
                            className="btn btn-ghost btn-xs btn-circle"
                          >
                            ⋮
                          </button>
                          <ul className="dropdown-content menu bg-base-200 rounded-box z-[1] w-24 p-1 shadow-lg gap-1 border border-base-300">
                            <li>
                              <button
                                type="button"
                                onClick={() => setEditingRule(rule)}
                                className="btn btn-ghost btn-xs justify-start px-2 py-1 text-left text-xs capitalize"
                              >
                                ✏️ Edit
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => handleDelete(rule.id)}
                                className="btn btn-ghost btn-xs text-error hover:bg-error/10 justify-start px-2 py-1 text-left text-xs capitalize"
                              >
                                🗑️ Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {rules.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-base-300 rounded-xl">
                  <span className="text-xs text-base-content/40 italic">
                    No automations yet. Create your first one!
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
