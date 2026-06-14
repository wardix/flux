import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { List } from '../../lib/types'
import { Trash2 } from 'lucide-react'

interface ApprovalRuleManagerProps {
  boardId: number
  lists: List[]
}

export function ApprovalRuleManager({ boardId, lists }: ApprovalRuleManagerProps) {
  const [rules, setRules] = useState<any[]>([])
  const [fromListId, setFromListId] = useState<number | ''>('')
  const [toListId, setToListId] = useState<number | ''>('')
  const [minApprovals, setMinApprovals] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchRules = async () => {
    try {
      const res = await api.get<{ data: any[] }>(`/boards/${boardId}/approval-rules`)
      setRules(res.data)
    } catch (err: any) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [boardId])

  const handleCreate = async () => {
    if (!fromListId || !toListId) return
    setIsLoading(true)
    setError(null)
    try {
      await api.post(`/boards/${boardId}/approval-rules`, {
        from_list_id: Number(fromListId),
        to_list_id: Number(toListId),
        min_approvals: minApprovals
      })
      setFromListId('')
      setToListId('')
      setMinApprovals(1)
      fetchRules()
    } catch (err: any) {
      setError(err.message || 'Failed to create rule')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Approval Rules</h3>
      <div className="bg-base-200 p-4 rounded-xl space-y-3">
        <h4 className="font-semibold text-sm">Add New Rule</h4>
        {error && <div className="text-error text-xs">{error}</div>}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-base-content/50 uppercase block mb-1">From List</label>
            <select 
              className="select select-sm select-bordered w-full"
              value={fromListId}
              onChange={e => setFromListId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select...</option>
              {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-base-content/50 uppercase block mb-1">To List</label>
            <select 
              className="select select-sm select-bordered w-full"
              value={toListId}
              onChange={e => setToListId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select...</option>
              {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-base-content/50 uppercase block mb-1">Min Approvals</label>
            <input 
              type="number" 
              className="input input-sm input-bordered w-full" 
              min={1} 
              value={minApprovals}
              onChange={e => setMinApprovals(Number(e.target.value))}
            />
          </div>
        </div>
        <button 
          className="btn btn-sm btn-primary mt-2" 
          onClick={handleCreate}
          disabled={isLoading || !fromListId || !toListId || fromListId === toListId}
        >
          Add Rule
        </button>
      </div>

      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between bg-base-100 border border-base-200 p-3 rounded-lg">
            <div className="text-sm">
              Require <strong>{rule.min_approvals}</strong> approval(s) to move from <strong>{rule.from_list}</strong> to <strong>{rule.to_list}</strong>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <p className="text-sm text-base-content/50 italic">No approval rules configured.</p>
        )}
      </div>
    </div>
  )
}
