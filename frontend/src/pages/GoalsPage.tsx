import type React from 'react'
import { useEffect, useState } from 'react'
import { CreateGoalModal } from '../components/goals/CreateGoalModal'
import { GoalCardLinker } from '../components/goals/GoalCardLinker'
import { GoalProgressBar } from '../components/goals/GoalProgressBar'
import { GoalTree } from '../components/goals/GoalTree'
import type { CreateGoalRequest, Goal } from '../lib/types'
import { useBoardStore } from '../stores/boardStore'
import { useGoalStore } from '../stores/goalStore'

export const GoalsPage: React.FC = () => {
  const activeWorkspace = useBoardStore((s) => s.activeWorkspace)
  const {
    goals,
    activeGoal,
    isLoading,
    fetchGoals,
    fetchGoal,
    createGoal,
    updateGoal,
    updateProgress,
    deleteGoal,
    linkCard,
    unlinkCard,
  } = useGoalStore()

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createParentId, setCreateParentId] = useState<number | undefined>(undefined)
  const [editingValue, setEditingValue] = useState('')

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchGoals(activeWorkspace.id)
    }
  }, [activeWorkspace?.id])

  useEffect(() => {
    if (activeGoal) {
      setEditingValue(String(activeGoal.current_value || 0))
    }
  }, [activeGoal])

  // Filter objectives
  const filteredObjectives = goals.filter((obj) => {
    if (filterStatus === 'all') return true
    return obj.status === filterStatus
  })

  const handleSelectGoal = (goal: Goal) => {
    fetchGoal(goal.id)
  }

  const handleCreateSubmit = async (data: CreateGoalRequest) => {
    await createGoal(data)
  }

  const handleStatusChange = async (status: 'active' | 'completed' | 'cancelled') => {
    if (!activeGoal) return
    await updateGoal(activeGoal.id, { status })
  }

  const handleProgressSave = async () => {
    if (!activeGoal) return
    const val = Number(editingValue)
    if (!Number.isNaN(val)) {
      await updateProgress(activeGoal.id, val)
    }
  }

  const handleDelete = async () => {
    if (!activeGoal) return
    if (
      confirm(
        'Apakah Anda yakin ingin menghapus sasaran ini? Tindakan ini akan menghapus semua anak Key Result atau tautan kartu.',
      )
    ) {
      const workspaceId = activeGoal.workspace_id
      await deleteGoal(activeGoal.id)
      if (workspaceId) {
        fetchGoals(workspaceId)
      }
    }
  }

  const handleLinkCard = async (cardId: number) => {
    if (!activeGoal) return
    await linkCard(activeGoal.id, cardId)
  }

  const handleUnlinkCard = async (cardId: number) => {
    if (!activeGoal) return
    await unlinkCard(activeGoal.id, cardId)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-base-100 border border-base-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-primary">Sasaran & OKR</h1>
          <p className="text-xs text-base-content/50 mt-1">
            Pantau dan kelola Target Strategis serta Key Results di Workspace Anda
          </p>
        </div>
        {activeWorkspace && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              setCreateParentId(undefined)
              setIsCreateOpen(true)
            }}
          >
            🎯 Create Objective
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Filters & Tree */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-base-100/50 p-4 border border-base-200 rounded-xl">
            <div className="tabs tabs-boxed bg-base-100/40 p-1 flex gap-1">
              <button
                type="button"
                className={`tab tab-sm font-semibold ${filterStatus === 'all' ? 'tab-active btn-primary' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All Status
              </button>
              <button
                type="button"
                className={`tab tab-sm font-semibold ${filterStatus === 'active' ? 'tab-active btn-primary' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                Active
              </button>
              <button
                type="button"
                className={`tab tab-sm font-semibold ${filterStatus === 'completed' ? 'tab-active btn-primary' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </button>
            </div>
            {isLoading && <span className="loading loading-spinner loading-xs text-primary"></span>}
          </div>

          <GoalTree objectives={filteredObjectives} onSelectGoal={handleSelectGoal} />
        </div>

        {/* Right column: Goal Details */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-6 min-h-[300px]">
          {activeGoal ? (
            <div className="space-y-6">
              {/* Goal Title & Type */}
              <div className="space-y-2 border-b border-base-200 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                      {activeGoal.type === 'objective' ? '🎯 Objective' : '📊 Key Result'}
                    </span>
                    <h2 className="text-lg font-bold text-base-content">{activeGoal.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn btn-xs btn-outline btn-error"
                  >
                    Hapus
                  </button>
                </div>
                {activeGoal.description && (
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {activeGoal.description}
                  </p>
                )}
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="label text-[10px] font-bold uppercase text-base-content/50">
                  Status
                </label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={activeGoal.status}
                  onChange={(e: any) => handleStatusChange(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Progress & Values */}
              <div className="space-y-2">
                <label className="label text-[10px] font-bold uppercase text-base-content/50">
                  Kemajuan (Progress)
                </label>
                <GoalProgressBar progress={activeGoal.progress || 0} size="md" />

                {activeGoal.type === 'key_result' && activeGoal.target_value && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs text-base-content/60">Update Progress Nilai:</span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        className="input input-bordered input-sm w-full font-mono text-xs"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                      />
                      <span className="text-xs flex items-center px-2 font-semibold bg-base-200 rounded-lg">
                        / {activeGoal.target_value} {activeGoal.unit || ''}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleProgressSave}
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Objective Specific Actions: Add Key Result */}
              {activeGoal.type === 'objective' && (
                <div className="pt-4 border-t border-base-200">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline btn-primary w-full gap-1"
                    onClick={() => {
                      setCreateParentId(activeGoal.id)
                      setIsCreateOpen(true)
                    }}
                  >
                    ➕ Add Key Result
                  </button>
                </div>
              )}

              {/* Key Result Specific Actions: GoalCardLinker */}
              {activeGoal.type === 'key_result' && (
                <div className="pt-4 border-t border-base-200">
                  <GoalCardLinker
                    goalId={activeGoal.id}
                    linkedCards={activeGoal.linked_cards || []}
                    onLink={handleLinkCard}
                    onUnlink={handleUnlinkCard}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-base-content/40 space-y-2">
              <span className="text-3xl">ℹ️</span>
              <p className="text-xs font-medium">
                Pilih salah satu sasaran di daftar untuk melihat detail.
              </p>
            </div>
          )}
        </div>
      </div>

      {activeWorkspace && (
        <CreateGoalModal
          isOpen={isCreateOpen}
          parentId={createParentId}
          workspaceId={activeWorkspace.id}
          onSubmit={handleCreateSubmit}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </div>
  )
}
export default GoalsPage
