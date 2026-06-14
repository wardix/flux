import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Card, CardMirror, CreateSubtaskRequest, Epic, SubtaskCard } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'
import { useUIStore } from '../../stores/uiStore'
import { AISuggestButton } from './AISuggestButton'
import { AISuggestionPanel } from './AISuggestionPanel'
import type { AISuggestionResult } from '../../lib/types'
import { MarkdownRenderer } from '../shared/MarkdownRenderer'
import { CardActivities } from './CardActivities'
import { CardAttachments } from './CardAttachments'
import { CardChecklists } from './CardChecklists'
import { CardComments } from './CardComments'
import { CardCoverPicker } from './CardCoverPicker'
import { CardGoalBadge } from './CardGoalBadge'
import { ChecklistProgress } from './ChecklistProgress'
import { CustomFieldBadge } from './CustomFieldBadge'
import { CustomFieldValues } from './CustomFieldValues'
import { EpicBadge } from './EpicBadge'
import { ManualTimeForm } from './ManualTimeForm'
import { MirrorBadge } from './MirrorBadge'
import { MirrorList } from './MirrorList'
import { MirrorSelector } from './MirrorSelector'
import { StoryPointBadge } from './StoryPointBadge'
import { StoryPointPicker } from './StoryPointPicker'
import { SubtaskList } from './SubtaskList'
import { SubtaskProgress } from './SubtaskProgress'
import { TimeLogList } from './TimeLogList'
import { TimeTracker } from './TimeTracker'
import { TiptapEditor } from './TiptapEditor'
import { extractTextFromJSON } from '../../lib/tiptapHelpers'
import { JSONContent } from '@tiptap/react'
import { VoteButton } from './VoteButton'
import { VoteCount } from './VoteCount'
import { VoterList } from './VoterList'
import { DependencyWithCard } from '../../lib/types'
import { DependencyBadge } from './DependencyBadge'
import { DependencySelector } from './DependencySelector'
import { LocationPicker } from './LocationPicker'
import { MapPin } from 'lucide-react'
import { ApprovalBadge } from './ApprovalBadge'
import { ApprovalDialog } from './ApprovalDialog'
import type { ApprovalRuleWithVotes } from '../../lib/types'

interface CardItemProps {
  card: Card
  isSubtask?: boolean
  isSelected?: boolean
  isMultiSelectMode?: boolean
  onSelect?: (cardId: number, isShiftClick: boolean) => void
}

export function CardItem({
  card,
  isSubtask = false,
  isSelected = false,
  isMultiSelectMode = false,
  onSelect,
}: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: isSubtask, // Disable dragging for subtasks
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [descriptionJson, setDescriptionJson] = useState<JSONContent | null>(card.description_json || null)
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.split('T')[0] : '')
  const [storyPoints, setStoryPoints] = useState<number | null>(card.story_points ?? null)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number, address: string} | null>(
    card.latitude && card.longitude ? { lat: card.latitude, lng: card.longitude, address: card.address || '' } : null
  )

  const [subtasks, setSubtasks] = useState<SubtaskCard[]>([])
  const [subtaskTotal, setSubtaskTotal] = useState(0)
  const [subtaskCompleted, setSubtaskCompleted] = useState(0)
  const [refreshActivitiesTrigger, setRefreshActivitiesTrigger] = useState(0)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const activeCardId = useBoardStore((s) => s.activeCardId)
  const aiFeaturesEnabled = useUIStore((s) => s.aiFeaturesEnabled)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestionResult | null>(null)

  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [timeMeta, setTimeMeta] = useState<any>({
    total_duration_seconds: 0,
    total_logs: 0,
    by_user: [],
  })

  const [approvalStatus, setApprovalStatus] = useState<ApprovalRuleWithVotes[]>([])
  const [selectedRuleForVote, setSelectedRuleForVote] = useState<ApprovalRuleWithVotes | null>(null)

  const fetchApprovalStatus = async () => {
    try {
      const res = await api.get<{ data: { rules: ApprovalRuleWithVotes[] } }>(`/cards/${card.id}/approval/status`)
      setApprovalStatus(res.data.rules || [])
    } catch (err) {
      console.error('Failed to fetch approval status', err)
    }
  }

  useEffect(() => {
    fetchApprovalStatus()
  }, [card.id, card.list_id]) // refetch if list changes

  const fetchTimeLogs = async () => {
    try {
      const res = await api.get<{ data: any[]; meta: any }>(`/cards/${card.id}/time-logs`)
      setTimeLogs(res.data)
      setTimeMeta(res.meta)
    } catch (err) {
      console.error('Failed to fetch time logs:', err)
    }
  }

  const token = localStorage.getItem('token')
  const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null
  const currentUserId = decoded ? Number(decoded.sub) : null
  const setActiveCardId = useBoardStore((s) => s.setActiveCardId)

  const userRole = useBoardStore((s) => s.userRole)
  const isObserver = userRole === 'observer'
  const boardMembers = useBoardStore((s) => s.boardMembers)
  const activeWorkspace = useBoardStore((s) => s.activeWorkspace)
  const [assigneeId, setAssigneeId] = useState<number | null>(card.assignee_id ?? null)
  const [epics, setEpics] = useState<Epic[]>([])
  const [selectedEpicId, setSelectedEpicId] = useState<number | null>(card.epic_id ?? null)

  const fetchEpics = async () => {
    if (!activeWorkspace?.id) return
    try {
      const res = await api.get<{ data: Epic[] }>(`/workspaces/${activeWorkspace.id}/epics`)
      setEpics(res.data || [])
    } catch (err) {
      console.error('Failed to fetch epics:', err)
    }
  }

  useEffect(() => {
    if (isOpen && activeWorkspace?.id) {
      fetchEpics()
    }
  }, [isOpen, activeWorkspace?.id])

  useEffect(() => {
    setSelectedEpicId(card.epic_id ?? null)
  }, [card.epic_id])

  const [isRecurring, setIsRecurring] = useState(card.is_recurring ?? false)
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    'weekly',
  )
  const [recurringRuleId, setRecurringRuleId] = useState<number | null>(null)

  const fetchRecurringRule = async () => {
    try {
      const res = await api.get<{ data: any }>(`/recurring-tasks/card/${card.id}`)
      if (res.data) {
        setIsRecurring(true)
        setRecurringFrequency(res.data.frequency)
        setRecurringRuleId(res.data.id)
      } else {
        setIsRecurring(false)
        setRecurringRuleId(null)
      }
    } catch (err) {
      console.error('Failed to fetch recurring task rule:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchRecurringRule()
    }
  }, [isOpen])

  const [mirrors, setMirrors] = useState<CardMirror[]>([])
  const [showMirrorSelector, setShowMirrorSelector] = useState(false)
  const [showDependencySelector, setShowDependencySelector] = useState(false)
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false)

  const fetchMirrors = async () => {
    try {
      const res = await api.get<{ data: CardMirror[] }>(`/cards/${card.id}/mirrors`)
      setMirrors(res.data || [])
    } catch (err) {
      console.error('Failed to fetch mirrors:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchMirrors()
    }
  }, [isOpen])

  const handleRemoveMirror = async (mirrorId: number) => {
    try {
      await api.delete(`/cards/${card.id}/mirror/${mirrorId}`)
      await fetchMirrors()
    } catch (err) {
      console.error('Failed to remove mirror:', err)
    }
  }

  const [dependencies, setDependencies] = useState<{ blocking: DependencyWithCard[], blocked_by: DependencyWithCard[] }>({ blocking: [], blocked_by: [] })

  const fetchDependencies = async () => {
    try {
      const res = await api.get<{ data: { blocking: DependencyWithCard[], blocked_by: DependencyWithCard[] } }>(`/cards/${card.id}/dependencies`)
      setDependencies(res.data)
    } catch (err) {
      console.error('Failed to fetch dependencies:', err)
    }
  }

  useEffect(() => {
    fetchDependencies()
  }, [card.id])

  const handleAddDependency = async (blockedCardId: number) => {
    try {
      await api.post(`/cards/${card.id}/dependencies`, { blocked_card_id: blockedCardId })
      await fetchDependencies()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add dependency')
    }
  }

  const handleRemoveDependency = async (depId: number) => {
    try {
      await api.delete(`/cards/${card.id}/dependencies/${depId}`)
      await fetchDependencies()
    } catch (err) {
      console.error('Failed to remove dependency:', err)
    }
  }


  const handleSelectCoverColor = async (color: string) => {
    try {
      await updateCard(card.id, { cover_color: color, cover_image_url: null })
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectCoverImage = async (url: string) => {
    try {
      await updateCard(card.id, { cover_image_url: url, cover_color: null })
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveCover = async () => {
    try {
      await updateCard(card.id, { cover_color: null, cover_image_url: null })
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleMirrorCreated = (newMirror: CardMirror) => {
    setMirrors((prev) => [...prev, newMirror])
    fetchMirrors()
  }
  const [linkedGoals, setLinkedGoals] = useState<any[]>([])
  const [allWorkspaceGoals, setAllWorkspaceGoals] = useState<any[]>([])
  const [selectedGoalToLink, setSelectedGoalToLink] = useState<number | null>(null)

  const fetchLinkedGoals = async () => {
    try {
      const res = await api.get<{ data: any[] }>(`/cards/${card.id}/goals`)
      setLinkedGoals(res.data || [])
    } catch (err) {
      console.error('Failed to fetch linked goals:', err)
    }
  }

  const fetchWorkspaceGoals = async () => {
    if (!activeWorkspace?.id) return
    try {
      const res = await api.get<{ data: any[] }>(`/goals?workspace_id=${activeWorkspace.id}`)
      const krs: any[] = []
      for (const obj of res.data || []) {
        if (obj.key_results) {
          for (const kr of obj.key_results) {
            krs.push({
              ...kr,
              objective_title: obj.title,
            })
          }
        }
      }
      setAllWorkspaceGoals(krs)
    } catch (err) {
      console.error('Failed to fetch workspace goals:', err)
    }
  }

  useEffect(() => {
    fetchLinkedGoals()
  }, [card.id])

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaceGoals()
    }
  }, [isOpen, activeWorkspace?.id])

  const handleLinkGoal = async () => {
    if (!selectedGoalToLink) return
    try {
      await api.post(`/goals/${selectedGoalToLink}/cards`, { card_id: card.id })
      setSelectedGoalToLink(null)
      fetchLinkedGoals()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard) {
        useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menghubungkan kartu ke sasaran')
    }
  }

  const handleUnlinkGoal = async (goalId: number) => {
    try {
      await api.delete(`/goals/${goalId}/cards/${card.id}`)
      fetchLinkedGoals()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard) {
        useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memutuskan tautan')
    }
  }

  useEffect(() => {
    if (activeCardId === card.id) {
      setIsOpen(true)
    }
  }, [activeCardId, card.id])

  useEffect(() => {
    setAssigneeId(card.assignee_id ?? null)
  }, [card.assignee_id])

  const closeOpenedModal = () => {
    setIsOpen(false)
    if (activeCardId === card.id) {
      setActiveCardId(null)
    }
  }

  const updateCard = useBoardStore((s) => s.updateCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)
  const archiveCard = useBoardStore((s) => s.archiveCard)
  const labels = useBoardStore((s) => s.labels)
  const addLabelToCard = useBoardStore((s) => s.addLabelToCard)
  const removeLabelFromCard = useBoardStore((s) => s.removeLabelFromCard)

  const isOverdue = card.due_date && new Date(card.due_date) < new Date() && !card.archived_at

  const fetchSubtasks = async () => {
    try {
      const res = await api.get<{
        subtasks: SubtaskCard[]
        totalCount: number
        completedCount: number
      }>(`/cards/${card.id}/subtasks`)
      setSubtasks(res.subtasks)
      setSubtaskTotal(res.totalCount)
      setSubtaskCompleted(res.completedCount)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (isOpen && !card.parent_card_id) {
      fetchSubtasks()
    }
  }, [isOpen, card.parent_card_id])

  useEffect(() => {
    if (isOpen) {
      fetchTimeLogs()
    }
  }, [isOpen])

  const handleAddSubtask = async (requestData: CreateSubtaskRequest) => {
    try {
      await api.post(`/cards/${card.id}/subtasks`, requestData)
      await fetchSubtasks()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleSubtask = async (subtaskId: number, isCompleted: boolean) => {
    try {
      await api.put(`/cards/${card.id}/subtasks/${subtaskId}`, { is_completed: isCompleted })
      await fetchSubtasks()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await api.delete(`/cards/${card.id}/subtasks/${subtaskId}`)
      await fetchSubtasks()
      const activeBoard = useBoardStore.getState().activeBoard
      if (activeBoard?.id) {
        await useBoardStore.getState().fetchBoard(activeBoard.id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdate = async () => {
    const updatedCard = {
      list_id: card.list_id,
      title,
      description: description || null,
      description_json: descriptionJson || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      assignee_id: assigneeId,
      epic_id: selectedEpicId,
      is_recurring: isRecurring,
      recurring_rule: isRecurring ? recurringFrequency : null,
      story_points: storyPoints,
      latitude: location?.lat || null,
      longitude: location?.lng || null,
      address: location?.address || null,
    }

    await updateCard(card.id, updatedCard)

    // Assign to Epic
    if (selectedEpicId !== card.epic_id) {
      try {
        await api.put(`/cards/${card.id}/epic`, { epic_id: selectedEpicId })
      } catch (err) {
        console.error('Failed to assign epic:', err)
      }
    }

    // Update Recurrence Task Rule
    try {
      if (isRecurring) {
        if (recurringRuleId) {
          // Update frequency and set to active
          await api.put(`/recurring-tasks/${recurringRuleId}`, {
            frequency: recurringFrequency,
            is_active: true,
          })
        } else {
          // Create new rule
          await api.post('/recurring-tasks', {
            card_id: card.id,
            frequency: recurringFrequency,
          })
        }
      } else {
        if (recurringRuleId) {
          // Disable/Delete rule
          await api.delete(`/recurring-tasks/${recurringRuleId}`)
        }
      }
    } catch (err) {
      console.error('Failed to update recurring task rule:', err)
    }

    const activeBoard = useBoardStore.getState().activeBoard
    if (activeBoard?.id) {
      await useBoardStore.getState().fetchBoard(activeBoard.id)
    }

    closeOpenedModal()
  }

  const toggleLabel = async (label: (typeof labels)[0]) => {
    const hasLabel = card.labels?.some((l) => l.id === label.id)
    if (hasLabel) {
      await removeLabelFromCard(card.id, label.id)
    } else {
      await addLabelToCard(card.id, label)
    }
  }

  const renderModal = () => (
    <div className="modal modal-open z-50">
      <div className="modal-box bg-base-100 border border-base-200 shadow-2xl relative space-y-4 max-w-lg">
        {aiFeaturesEnabled && aiSuggestion && (
          <AISuggestionPanel
            suggestions={aiSuggestion}
            onAccept={async (item) => {
              if (aiSuggestion.type === 'labels') {
                const labelObj = labels.find((l) => l.id === item.id)
                if (labelObj) {
                  const alreadyHas = card.labels?.some((l) => l.id === item.id)
                  if (!alreadyHas) {
                    await addLabelToCard(card.id, labelObj)
                  }
                }
              } else if (aiSuggestion.type === 'assignee') {
                setAssigneeId(item.id)
              }
            }}
            onReject={(item) => {
              if (aiSuggestion.type === 'labels' && aiSuggestion.data?.suggested_labels) {
                setAiSuggestion({
                  ...aiSuggestion,
                  data: {
                    ...aiSuggestion.data,
                    suggested_labels: aiSuggestion.data.suggested_labels.filter((l) => l.id !== item.id),
                  },
                })
              }
            }}
            onDismiss={() => setAiSuggestion(null)}
          />
        )}
        <button
          type="button"
          onClick={() => {
            setAiSuggestion(null)
            closeOpenedModal()
          }}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>
        <div className="flex justify-between items-center pr-8">
          <h3 className="font-bold text-lg text-primary">
            {isObserver ? 'Card Details (Read-only)' : 'Edit Card Details'}
          </h3>
          {!isObserver && (
            <div className="relative">
              <button
                type="button"
                className="btn btn-xs btn-outline btn-primary font-semibold"
                onClick={() => setIsCoverPickerOpen(!isCoverPickerOpen)}
              >
                🖼️ Cover
              </button>
              <CardCoverPicker
                currentCoverColor={card.cover_color ?? null}
                currentCoverImageUrl={card.cover_image_url ?? null}
                onSelectColor={handleSelectCoverColor}
                onSelectImage={handleSelectCoverImage}
                onRemove={handleRemoveCover}
                isOpen={isCoverPickerOpen}
                onClose={() => setIsCoverPickerOpen(false)}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
              Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isObserver}
              className="input input-bordered input-sm w-full focus:outline-none focus:input-primary"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/50 font-bold uppercase">
                  Description
                </span>
                {aiFeaturesEnabled && !isObserver && (
                  <AISuggestButton
                    type="summarize"
                    cardId={card.id}
                    payload={{}}
                    onSuggestion={setAiSuggestion}
                  />
                )}
              </div>
            </div>
            <TiptapEditor
              content={descriptionJson || (description ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }] } : null)}
              onUpdate={(json, text) => {
                setDescriptionJson(json)
                setDescription(text)
              }}
              editable={!isObserver}
            />
          </div>

          {/* SubtaskList rendering for parent cards only */}
          {!card.parent_card_id && (
            <SubtaskList
              subtasks={subtasks}
              total={subtaskTotal}
              completed={subtaskCompleted}
              onAdd={handleAddSubtask}
              onToggle={handleToggleSubtask}
              onDelete={handleDeleteSubtask}
              disabled={isObserver}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
                Due Date
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isObserver}
                className="input input-bordered input-sm w-full focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-base-content/50 font-bold uppercase block">
                  Assignee
                </span>
                {aiFeaturesEnabled && !isObserver && (
                  <AISuggestButton
                    type="assignee"
                    cardId={card.id}
                    payload={{
                      title,
                      description,
                      available_members: boardMembers.map((m: any) => ({
                        id: m.user_id,
                        name: m.email.split('@')[0],
                      })),
                    }}
                    onSuggestion={setAiSuggestion}
                  />
                )}
              </div>
              <select
                value={assigneeId ?? ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
                disabled={isObserver}
                className="select select-bordered select-sm w-full focus:outline-none focus:select-primary"
              >
                <option value="">Unassigned</option>
                {boardMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.email} ({member.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!card.parent_card_id && (
            <div>
              <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
                Epic
              </span>
              <select
                value={selectedEpicId ?? ''}
                onChange={(e) => setSelectedEpicId(e.target.value ? Number(e.target.value) : null)}
                disabled={isObserver}
                className="select select-bordered select-sm w-full focus:outline-none focus:select-primary"
              >
                <option value="">No Epic</option>
                {epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    💎 {epic.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!card.parent_card_id && (
            <div className="border border-base-200 rounded-lg p-3 bg-base-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/60 font-bold uppercase">
                  🔁 Recurring Task
                </span>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  disabled={isObserver}
                  className="toggle toggle-primary toggle-sm"
                />
              </div>
              {isRecurring && (
                <div className="space-y-1">
                  <span className="text-[10px] text-base-content/50 uppercase block">
                    Frequency
                  </span>
                  <select
                    value={recurringFrequency}
                    onChange={(e: any) => setRecurringFrequency(e.target.value)}
                    disabled={isObserver}
                    className="select select-bordered select-xs w-full"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
              Story Points
            </span>
            <StoryPointPicker value={storyPoints} onChange={setStoryPoints} disabled={isObserver} />
          </div>

          {!card.parent_card_id && (
            <div>
              <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
                Location
              </span>
              {location ? (
                <div className="flex items-center gap-2 mb-2 bg-base-200 p-2 rounded text-sm">
                  <MapPin size={16} className="text-error shrink-0" />
                  <span className="truncate flex-1">{location.address || `${location.lat}, ${location.lng}`}</span>
                  {!isObserver && (
                    <button 
                      className="btn btn-xs btn-ghost text-error" 
                      onClick={() => setLocation(null)}
                    >
                      Clear
                    </button>
                  )}
                </div>
              ) : null}
              {!isObserver && (
                <button 
                  className="btn btn-sm btn-outline w-full"
                  onClick={() => setIsLocationPickerOpen(true)}
                >
                  {location ? 'Edit Location' : 'Add Location'}
                </button>
              )}
            </div>
          )}

          {!card.parent_card_id && (
            <>
              <div className="border-t border-base-200 pt-3">
                <span className="text-xs text-base-content/50 font-bold uppercase block mb-2">
                  Dependencies
                </span>
                <DependencySelector
                  cardId={card.id}
                  boardId={card.board_id!}
                  dependencies={dependencies}
                  onAdd={handleAddDependency}
                  onRemove={handleRemoveDependency}
                  disabled={isObserver}
                />
              </div>

              <div className="border-t border-base-200 pt-3">
                <span className="text-xs text-base-content/50 font-bold uppercase block mb-2">
                  Checklists
                </span>
                <CardChecklists
                  cardId={card.id}
                  disabled={isObserver}
                  boardMembers={boardMembers.map((m: any) => ({
                    id: m.user_id,
                    name: m.name || m.email || '',
                    avatar_url: m.avatar_url || null,
                  }))}
                  onProgressChange={async () => {
                    const activeBoard = useBoardStore.getState().activeBoard
                    if (activeBoard?.id) {
                      await useBoardStore.getState().fetchBoard(activeBoard.id)
                    }
                  }}
                />
              </div>

              <div className="border-t border-base-200 pt-3">
                <span className="text-xs text-base-content/50 font-bold uppercase block mb-2">
                  Attachments
                </span>
                <CardAttachments
                  cardId={card.id}
                  disabled={isObserver}
                  onCoverChange={async () => {
                    const activeBoard = useBoardStore.getState().activeBoard
                    if (activeBoard?.id) {
                      await useBoardStore.getState().fetchBoard(activeBoard.id)
                    }
                  }}
                />
              </div>
            </>
          )}

          {/* Labels list toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-base-content/50 font-bold uppercase block">
                Labels
              </span>
              {aiFeaturesEnabled && !isObserver && (
                <AISuggestButton
                  type="labels"
                  cardId={card.id}
                  payload={{
                    title,
                    description,
                    available_labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
                  }}
                  onSuggestion={setAiSuggestion}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {labels.map((l) => {
                const active = card.labels?.some((cl) => cl.id === l.id)
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => !isObserver && toggleLabel(l)}
                    disabled={isObserver}
                    style={{
                      backgroundColor: active ? l.color : undefined,
                      borderColor: l.color,
                    }}
                    className={`btn btn-xs rounded transition-all capitalize border ${
                      active ? 'text-white' : 'btn-outline text-base-content/70'
                    }`}
                  >
                    {l.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Fields section */}
          {useBoardStore.getState().activeBoard?.id && (
            <CustomFieldValues
              cardId={card.id}
              boardId={useBoardStore.getState().activeBoard!.id}
              disabled={isObserver}
            />
          )}

          {!card.parent_card_id && (
            <div className="border-t border-base-200 pt-3 space-y-2">
              <span className="text-xs text-base-content/50 font-bold uppercase block">
                Voting & Priority
              </span>
              <div className="flex flex-col gap-3">
                <div>
                  <VoteButton card={card} />
                </div>
                <VoterList card={card} />
              </div>
            </div>
          )}

          <div className="border-t border-base-200 pt-3 space-y-3">
            <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
              Time Tracking
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimeTracker cardId={card.id} onLogAdded={fetchTimeLogs} />
              <ManualTimeForm cardId={card.id} onLogAdded={fetchTimeLogs} />
            </div>
            <TimeLogList
              logs={timeLogs}
              meta={timeMeta}
              currentUserId={currentUserId}
              onLogDeleted={fetchTimeLogs}
            />
          </div>

          {!card.parent_card_id && (
            <div className="border-t border-base-200 pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/50 font-bold uppercase">
                  Card Mirroring
                </span>
                {!isObserver && (
                  <button
                    type="button"
                    onClick={() => setShowMirrorSelector(true)}
                    className="btn btn-xs btn-primary btn-outline"
                  >
                    🔗 Mirror to...
                  </button>
                )}
              </div>
              <MirrorList cardId={card.id} mirrors={mirrors} onRemoveMirror={handleRemoveMirror} />
            </div>
          )}

          {!card.parent_card_id && (
            <div className="border-t border-base-200 pt-3 space-y-3">
              <span className="text-xs text-base-content/50 font-bold uppercase block">
                Tautan Sasaran (OKR Goals)
              </span>

              {!isObserver && allWorkspaceGoals.length > 0 && (
                <div className="flex gap-2">
                  <select
                    className="select select-bordered select-xs w-full"
                    value={selectedGoalToLink || ''}
                    onChange={(e) =>
                      setSelectedGoalToLink(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">-- Hubungkan ke Key Result --</option>
                    {allWorkspaceGoals
                      .filter((g) => !linkedGoals.some((lg) => lg.id === g.id))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          🎯 {g.objective_title} → 📊 {g.title}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-xs btn-primary font-semibold"
                    disabled={!selectedGoalToLink}
                    onClick={handleLinkGoal}
                  >
                    Tautkan
                  </button>
                </div>
              )}

              {linkedGoals.length === 0 ? (
                <p className="text-xs text-base-content/40 italic">
                  Kartu ini belum terhubung ke sasaran mana pun.
                </p>
              ) : (
                <div className="space-y-2">
                  {linkedGoals.map((g) => (
                    <div
                      key={g.id}
                      className="flex justify-between items-center text-xs p-2 rounded-lg border border-base-200 bg-base-50"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate text-base-content">{g.title}</span>
                        <span className="text-[10px] text-base-content/50">
                          Progress: {Math.round(g.progress)}%
                        </span>
                      </div>
                      {!isObserver && (
                        <button
                          type="button"
                          onClick={() => handleUnlinkGoal(g.id)}
                          className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                        >
                          Unlink
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-base-200 pt-3">
            <span className="text-xs text-base-content/50 font-bold uppercase block mb-2">
              Komentar
            </span>
            <CardComments
              cardId={card.id}
              disabled={isObserver}
              onCommentsChange={() => setRefreshActivitiesTrigger((t) => t + 1)}
            />
          </div>

          <div className="border-t border-base-200 pt-3">
            <span className="text-xs text-base-content/50 font-bold uppercase block mb-2">
              Aktivitas
            </span>
            <CardActivities cardId={card.id} refreshTrigger={refreshActivitiesTrigger} />
          </div>
        </div>

        <div className="modal-action flex justify-between items-center w-full">
          {!isObserver ? (
            <button
              type="button"
              onClick={async () => {
                await archiveCard(card.id)
                closeOpenedModal()
              }}
              className="btn btn-warning btn-sm btn-outline gap-1"
            >
              📦 Archive
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            {!isObserver ? (
              <>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="btn btn-primary btn-sm px-6"
                >
                  Save
                </button>
                <button type="button" onClick={closeOpenedModal} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={closeOpenedModal}
                className="btn btn-primary btn-sm px-6"
              >
                Close
              </button>
            )}
          </div>
        </div>
        {showMirrorSelector && (
          <MirrorSelector
            cardId={card.id}
            currentBoardId={useBoardStore.getState().activeBoard?.id || 0}
            onMirrorCreated={handleMirrorCreated}
            onClose={() => setShowMirrorSelector(false)}
          />
        )}

        {isLocationPickerOpen && (
          <LocationPicker
            initialLat={location?.lat}
            initialLng={location?.lng}
            initialAddress={location?.address}
            onClose={() => setIsLocationPickerOpen(false)}
            onLocationSelect={(lat, lng, address) => {
              setLocation({ lat, lng, address })
              setIsLocationPickerOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )

  if (isSubtask) {
    return (
      <>
        {/* biome-ignore lint/a11y/useSemanticElements: interactive title to open subtask */}
        <span
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
          className={`font-medium cursor-pointer truncate hover:text-primary hover:underline flex-1 text-left ${
            card.is_completed ? 'line-through text-base-content/40' : 'text-base-content/85'
          }`}
        >
          {card.title}
        </span>
        {isOpen && renderModal()}
      </>
    )
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        role="option"
        tabIndex={0}
        data-card-id={card.id}
        onClick={(e) => {
          if (isSubtask) {
            setIsOpen(true)
            return
          }
          const isCmdOrCtrl = e.metaKey || e.ctrlKey
          const isShift = e.shiftKey
          if (isMultiSelectMode || isCmdOrCtrl || isShift) {
            e.preventDefault()
            e.stopPropagation()
            if (onSelect) {
              onSelect(card.id, isShift)
            }
            return
          }
          setIsOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (isMultiSelectMode) {
              if (onSelect) onSelect(card.id, false)
            } else {
              setIsOpen(true)
            }
          }
        }}
        className={`card shadow-sm border transition-all p-3 space-y-2 group relative cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/40 overflow-hidden ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'bg-base-100 border-base-200/50 hover:shadow-md hover:border-primary/30'
        }`}
      >
        {/* Cover Image/Color */}
        {card.cover_image_url ? (
          <div className="w-[calc(100%+1.5rem)] h-[120px] -mt-3 -mx-3 mb-2 overflow-hidden relative">
            <img src={card.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        ) : card.cover_color ? (
          <div
            className="w-[calc(100%+1.5rem)] h-[32px] -mt-3 -mx-3 mb-2"
            style={{ backgroundColor: card.cover_color }}
          />
        ) : card.cover_file_path ? (
          <div className="w-[calc(100%+1.5rem)] h-28 -mt-3 -mx-3 mb-2 overflow-hidden relative">
            <img src={card.cover_file_path} alt="Cover" className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="flex gap-2.5 items-start w-full">
          {isMultiSelectMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="checkbox checkbox-primary checkbox-xs mt-1 flex-shrink-0 z-10"
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Labels header */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.labels.map((l) => (
                  <span
                    key={l.id}
                    style={{ backgroundColor: l.color }}
                    className="text-[9px] text-white px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase"
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            )}

            {/* Custom Fields Badge preview */}
            <CustomFieldBadge cardId={card.id} />

            {/* Epic Badge preview */}
            {card.epic_id && (
              <div className="flex">
                <EpicBadge title="Epic" color="#6366f1" />
              </div>
            )}

            {/* Recurring Badge preview */}
            {card.is_recurring && (
              <div className="flex">
                <span className="badge badge-sm badge-info text-white text-[10px] uppercase font-bold tracking-wider">
                  🔁 Recurring
                </span>
              </div>
            )}

            {/* Mirror Badge preview */}
            {card.is_mirror && card.source_board_title && card.source_board_id && (
              <div className="flex">
                <MirrorBadge
                  sourceBoardTitle={card.source_board_title}
                  onClick={() => {
                    if (card.source_board_id) {
                      const fetchBoard = useBoardStore.getState().fetchBoard
                      fetchBoard(card.source_board_id)
                    }
                  }}
                />
              </div>
            )}

            {/* Linked Goals Badges */}
            {linkedGoals.length > 0 && <CardGoalBadge goals={linkedGoals} />}

            {/* Approval Badges */}
            {approvalStatus.length > 0 && (
              <div className="flex flex-wrap gap-1" onClick={(e) => { e.stopPropagation(); setSelectedRuleForVote(approvalStatus[0]); }}>
                {approvalStatus.map(rule => (
                  <ApprovalBadge key={rule.id} status={rule} />
                ))}
              </div>
            )}

            <div className="flex items-start justify-between relative">
              <h4 className="font-medium text-sm text-base-content/90 line-clamp-2 pr-6">
                {card.title}
              </h4>
              {!isMultiSelectMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCard(card.id)
                  }}
                  className="btn btn-ghost btn-xs btn-circle absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-error hover:bg-error/10"
                  title="Delete Card"
                >
                  ✕
                </button>
              )}
            </div>

            {card.description && (
              <p className="text-xs text-base-content/65 line-clamp-2 leading-relaxed">
                {card.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {card.due_date && (
                  <span
                    className={`badge badge-sm gap-1 text-[10px] font-bold ${
                      new Date(card.due_date) < new Date() && !card.is_completed
                        ? 'badge-error text-white'
                        : 'badge-ghost'
                    }`}
                  >
                    <Calendar size={10} />
                    {new Date(card.due_date).toLocaleDateString()}
                  </span>
                )}
                
                {/* Dependency Badge */}
                <DependencyBadge
                  blockingCount={dependencies.blocking.length}
                  blockedByCount={dependencies.blocked_by.length}
                  isBlocked={dependencies.blocked_by.some(d => !d.card.is_completed)}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDependencySelector(true)
                  }}
                />

                {card.subtask_count && card.subtask_count.total > 0 && (
                  <SubtaskProgress
                    completed={card.subtask_count.completed}
                    total={card.subtask_count.total}
                  />
                )}
                {card.checklist_count && card.checklist_count.total > 0 && (
                  <ChecklistProgress
                    completed={card.checklist_count.completed}
                    total={card.checklist_count.total}
                  />
                )}
                <VoteCount card={card} />
              </div>
              <div className="flex items-center gap-1.5">
                {card.assignee_avatar && (
                  <div className="avatar" title={card.assignee_email || 'Assigned User'}>
                    <div className="w-5 h-5 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                      <img src={card.assignee_avatar} alt="Avatar" />
                    </div>
                  </div>
                )}
                {card.story_points !== null && card.story_points !== undefined && (
                  <StoryPointBadge points={card.story_points} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isOpen && renderModal()}
      {selectedRuleForVote && (
        <ApprovalDialog 
          cardId={card.id} 
          rule={selectedRuleForVote} 
          onClose={() => setSelectedRuleForVote(null)} 
          onVoteComplete={fetchApprovalStatus} 
        />
      )}
    </>
  )
}
