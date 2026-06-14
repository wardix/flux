import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { BoardColumn } from './components/board/BoardColumn'
import { useTheme } from './hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { useBoardStore } from './stores/boardStore'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import type { List, Card } from './lib/types'
import { useWebSocket } from './hooks/useWebSocket'
import { PresenceIndicator } from './components/shared/PresenceIndicator'
import { ActiveTimerIndicator } from './components/shared/ActiveTimerIndicator'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { ExportDialog } from './components/board/ExportDialog'
import { CustomFieldEditor } from './components/board/CustomFieldEditor'
import { AutomationList } from './components/board/AutomationList'
import { SprintPlanning } from './components/board/SprintPlanning'
import { SprintBoard } from './components/board/SprintBoard'
import { BurndownChart } from './components/board/BurndownChart'
import { api } from './lib/api'
import type { Sprint } from './lib/types'
import { EpicList } from './components/board/EpicList'
import { EpicDetail } from './components/board/EpicDetail'


function decodeToken(token: string | null) {
  if (!token) return null
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

function App() {
  const { t } = useTranslation()
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<any>(null)
  const [show2FASettings, setShow2FASettings] = useState(false)
  const [showAdminPage, setShowAdminPage] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  const { theme, setTheme, accentColor, setAccentColor } = useTheme()
  const {
    boards,
    workspaces,
    labels,
    activeWorkspace,
    activeBoard,
    fetchWorkspaces,
    selectWorkspace,
    createWorkspace,
    fetchBoards,
    fetchBoard,
    createBoard,
    updateBoardVisibility,
    createList,
    fetchLabels,
    createLabel,
    moveCard,
    fetchArchive,
    fetchTrash,
    restoreCard,
    restoreList,
    deleteCardPermanently,
    deleteListPermanently,
    deleteBoard,
    boardMembers,
    userRole,
    inviteBoardMember,
    toggleStarBoard,
    addListLocally,
    updateListLocally,
    removeListLocally,
    addCardLocally,
    updateCardLocally,
    removeCardLocally,
    moveCardLocally,
    fetchActiveTimer,
    currentSort,
    setSort,
  } = useBoardStore()

  const decoded = decodeToken(token)
  const currentUserId = decoded ? Number(decoded.sub) : null

  useEffect(() => {
    if (token) {
      api.get<{ data: any }>('/auth/me')
        .then((res) => {
          if (res.data.is_suspended) {
            alert('Your account has been suspended by an admin.')
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
            return
          }
          setUser(res.data)
        })
        .catch((err) => {
          console.error('Failed to fetch user info:', err)
          if (err.message?.includes('401') || err.message?.includes('403')) {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        })
    } else {
      setUser(null)
    }
  }, [token])

  const { isConnected: _isWSConnected, onlineUsers } = useWebSocket({
    boardId: activeBoard?.id || 0,
    enabled: !!token && !!activeBoard?.id,
    onEvent: (event) => {
      if (event.userId === currentUserId) return

      switch (event.type) {
        case 'card_created':
          addCardLocally(event.payload)
          break
        case 'card_updated':
          updateCardLocally(event.payload)
          break
        case 'card_deleted':
          removeCardLocally(event.payload.id)
          break
        case 'card_moved':
          moveCardLocally(event.payload)
          break
        case 'list_created':
          addListLocally(event.payload)
          break
        case 'list_updated':
          updateListLocally(event.payload)
          break
        case 'list_deleted':
          removeListLocally(event.payload.id)
          break
        default:
          break
      }
    },
  })

  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  const [isAddingBoard, setIsAddingBoard] = useState(false)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  const [archivedItems, setArchivedItems] = useState<{ lists: List[]; cards: Card[] }>({
    lists: [],
    cards: [],
  })
  const [trashedItems, setTrashedItems] = useState<{ lists: List[]; cards: Card[] }>({
    lists: [],
    cards: [],
  })

  // Sprints related States
  const [sprintTab, setSprintTab] = useState<'board' | 'planning' | 'burndown'>('board')
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [sprintViewEnabled, setSprintViewEnabled] = useState(false)

  // Epics related States
  const [epicViewEnabled, setEpicViewEnabled] = useState(false)
  const [selectedEpicId, setSelectedEpicId] = useState<number | null>(null)


  const fetchSprints = async () => {
    if (!activeBoard) return
    try {
      const res = await api.get<{ data: Sprint[] }>(`/boards/${activeBoard.id}/sprints`)
      setSprints(res.data || [])
    } catch (err) {
      console.error('Failed to fetch sprints:', err)
    }
  }

  const handleCreateSprint = async (data: any) => {
    if (!activeBoard) return
    await api.post(`/boards/${activeBoard.id}/sprints`, data)
    await fetchSprints()
  }

  const handleDeleteSprint = async (sprintId: number) => {
    if (!activeBoard) return
    await api.delete(`/boards/${activeBoard.id}/sprints/${sprintId}`)
    await fetchSprints()
  }

  const handleStartSprint = async (sprintId: number) => {
    if (!activeBoard) return
    await api.put(`/boards/${activeBoard.id}/sprints/${sprintId}/start`, {})
    await fetchSprints()
  }

  const handleCompleteSprint = async (sprintId: number, moveToSprintId?: number | null) => {
    if (!activeBoard) return
    await api.put(`/boards/${activeBoard.id}/sprints/${sprintId}/complete`, {
      move_incomplete_to_sprint_id: moveToSprintId,
    })
    await fetchSprints()
    await fetchBoard(activeBoard.id) // Reload board to reflect moves/status changes
  }

  const handleAssignSprint = async (cardId: number, sprintId: number | null) => {
    await api.put(`/cards/${cardId}/sprint`, { sprint_id: sprintId })
    if (activeBoard) {
      await fetchBoard(activeBoard.id) // Reload cards
    }
  }

  useEffect(() => {
    if (activeBoard?.id) {
      fetchSprints()
    } else {
      setSprints([])
    }
  }, [activeBoard?.id])

  const loadArchive = async () => {
    if (!activeBoard) return
    const data = await fetchArchive(activeBoard.id)
    setArchivedItems(data)
  }

  const loadTrash = async () => {
    if (!activeBoard) return
    const data = await fetchTrash(activeBoard.id)
    setTrashedItems(data)
  }

  const accents = [
    { name: 'indigo', label: 'Indigo', color: 'bg-indigo-600' },
    { name: 'blue', label: 'Blue', color: 'bg-blue-600' },
    { name: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
    { name: 'rose', label: 'Rose', color: 'bg-rose-600' },
    { name: 'amber', label: 'Amber', color: 'bg-amber-600' },
    { name: 'violet', label: 'Violet', color: 'bg-violet-600' },
  ]

  useEffect(() => {
    if (token) {
      fetchWorkspaces()
      fetchBoards()
      fetchActiveTimer()
    }
  }, [fetchWorkspaces, fetchBoards, fetchActiveTimer, token])

  useEffect(() => {
    if (activeBoard?.id) {
      fetchLabels(activeBoard.id)
    }
  }, [activeBoard?.id, fetchLabels])

  // Filter boards based on selected workspace
  const filteredBoards = boards.filter((b) => b.workspace_id === activeWorkspace?.id)
  const starredBoards = filteredBoards.filter((b) => b.is_starred)

  useEffect(() => {
    if (filteredBoards.length > 0 && !activeBoard) {
      fetchBoard(filteredBoards[0].id)
    }
  }, [filteredBoards, activeBoard, fetchBoard])

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return
    await createWorkspace(newWorkspaceName.trim())
    setNewWorkspaceName('')
    setIsAddingWorkspace(false)
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return
    await createBoard(newBoardTitle.trim(), activeWorkspace?.id, 'private')
    setNewBoardTitle('')
    setIsAddingBoard(false)
  }

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnTitle.trim() || !activeBoard) return
    await createList(activeBoard.id, newColumnTitle.trim())
    setNewColumnTitle('')
    setIsAddingColumn(false)
  }

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !activeWorkspace) return
    alert(`Mock Invitation sent to ${inviteEmail} for workspace: ${activeWorkspace.name}`)
    setInviteEmail('')
    setIsInviting(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (userRole === 'observer') return
    const { active, over } = event
    if (!over) return

    const cardId = Number(active.id)
    const overId = over.id

    let targetListId: number | null = null
    let targetIndex = 0

    const targetIsList = activeBoard?.lists?.some(
      (l) => `list-${l.id}` === overId || l.id === overId,
    )

    let sourceListId: number | null = null
    for (const list of activeBoard?.lists || []) {
      if (list.cards?.some((c) => c.id === cardId)) {
        sourceListId = list.id
        break
      }
    }
    if (!sourceListId) return

    if (targetIsList) {
      const parsedId =
        typeof overId === 'string' && overId.startsWith('list-')
          ? Number(overId.replace('list-', ''))
          : Number(overId)
      targetListId = parsedId
      const targetList = activeBoard?.lists?.find((l) => l.id === targetListId)
      targetIndex = targetList?.cards?.length || 0
    } else {
      const targetCardId = Number(overId)
      for (const list of activeBoard?.lists || []) {
        const idx = list.cards?.findIndex((c) => c.id === targetCardId)
        if (idx !== undefined && idx !== -1) {
          targetListId = list.id
          targetIndex = idx
          break
        }
      }
    }

    if (targetListId !== null) {
      await moveCard(cardId, sourceListId, targetListId, targetIndex)
    }
  }

  if (!token) {
    return (
      <LoginPage
        onLoginSuccess={(t, u) => {
          setToken(t)
          setUser(u)
        }}
      />
    )
  }

  return (
    <div className="flex h-screen bg-base-300 text-base-content overflow-hidden selection:bg-primary selection:text-primary-content transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-base-100 flex flex-col border-r border-base-200/50">
        {/* Workspace Dropdown Header */}
        <div className="p-4 border-b border-base-200/50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Workspace
            </span>
            <button
              type="button"
              onClick={() => setIsAddingWorkspace(!isAddingWorkspace)}
              className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
              title="Add Workspace"
            >
              +
            </button>
          </div>

          {isAddingWorkspace ? (
            <form
              onSubmit={handleCreateWorkspace}
              className="space-y-2 p-2 bg-base-200/50 rounded-xl border border-base-200"
            >
              <input
                type="text"
                placeholder="Workspace name..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="input input-xs input-bordered input-primary w-full focus:outline-none"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary btn-xs flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingWorkspace(false)
                    setNewWorkspaceName('')
                  }}
                  className="btn btn-ghost btn-xs flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="dropdown w-full">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-primary btn-sm btn-block justify-between capitalize text-white"
              >
                🏢 {activeWorkspace ? activeWorkspace.name : 'Select WS'}
                <span>▾</span>
              </button>
              <ul className="dropdown-content menu bg-base-200 rounded-box z-[1] w-full p-2 shadow-lg gap-1 border border-base-300">
                {workspaces.map((ws) => (
                  <li key={ws.id}>
                    <button
                      type="button"
                      onClick={() => selectWorkspace(ws)}
                      className={activeWorkspace?.id === ws.id ? 'active font-bold' : ''}
                    >
                      {ws.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Boards Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {starredBoards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50 flex items-center gap-1">
                  ★ Starred Boards
                </span>
              </div>
              <ul className="menu menu-sm p-0 gap-1">
                {starredBoards.map((b) => (
                  <li key={`starred-${b.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setShow2FASettings(false)
                        fetchBoard(b.id)
                      }}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg text-left ${
                        !show2FASettings && activeBoard?.id === b.id
                          ? 'active bg-primary text-primary-content font-semibold'
                          : 'hover:bg-base-200'
                      }`}
                    >
                      <span className="truncate">📋 {b.title}</span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleStarBoard(b.id)}
                          className="text-xs text-yellow-500 hover:text-yellow-600 focus:outline-none hover:scale-110 transition-transform"
                          title="Unstar Board"
                        >
                          ★
                        </button>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Boards
              </span>
              <button
                type="button"
                onClick={() => setIsAddingBoard(!isAddingBoard)}
                className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
              >
                +
              </button>
            </div>

            {isAddingBoard && (
              <form
                onSubmit={handleCreateBoard}
                className="p-2 space-y-2 bg-base-200/50 rounded-xl border border-base-200"
              >
                <input
                  type="text"
                  placeholder="Board name..."
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="input input-xs input-bordered input-primary w-full focus:outline-none"
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-xs flex-1">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBoard(false)
                      setNewBoardTitle('')
                    }}
                    className="btn btn-ghost btn-xs flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <ul className="menu menu-sm p-0 gap-1">
              {filteredBoards.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setShow2FASettings(false)
                      setEpicViewEnabled(false)
                      fetchBoard(b.id)
                    }}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg text-left ${
                      !show2FASettings && !epicViewEnabled && activeBoard?.id === b.id
                        ? 'active bg-primary text-primary-content font-semibold'
                        : 'hover:bg-base-200'
                    }`}

                  >
                    <span className="truncate">📋 {b.title}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleStarBoard(b.id)}
                        className={`text-xs focus:outline-none hover:scale-110 transition-transform ${
                          b.is_starred ? 'text-yellow-500' : 'text-base-content/30 hover:text-yellow-500'
                        }`}
                        title={b.is_starred ? 'Unstar Board' : 'Star Board'}
                      >
                        {b.is_starred ? '★' : '☆'}
                      </button>
                      <span className="text-[9px] uppercase opacity-60 px-1 border border-base-content/20 rounded">
                        {b.visibility === 'workspace-only' ? 'WS' : b.visibility}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
              {filteredBoards.length === 0 && (
                <div className="text-center text-xs text-base-content/40 py-4">
                  No boards in this workspace
                </div>
              )}
            </ul>
          </div>
        </div>

        {/* Invitation & Customization Footer */}
        <div className="p-4 border-t border-base-200/50 space-y-4 bg-base-200/20">
          {/* Invite Members */}
          {activeWorkspace && (
            <div className="space-y-2 border-b border-base-200/50 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50">
                  Members
                </span>
                <button
                  type="button"
                  onClick={() => setIsInviting(!isInviting)}
                  className="text-xs text-primary hover:underline"
                >
                  Invite
                </button>
              </div>

              {isInviting && (
                <form onSubmit={handleInviteMember} className="space-y-2">
                  <input
                    type="email"
                    placeholder="User email..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input input-xs input-bordered input-primary w-full focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary btn-xs flex-1">
                      Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInviting(false)
                        setInviteEmail('')
                      }}
                      className="btn btn-ghost btn-xs flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Settings Section */}
          <div className="space-y-2 pb-2 border-b border-base-200/50">
            {user?.is_super_admin && (
              <button
                type="button"
                onClick={() => {
                  setShowAdminPage(!showAdminPage)
                  setShow2FASettings(false)
                }}
                className={`btn btn-sm btn-block justify-start capitalize ${
                  showAdminPage ? 'btn-primary text-white' : 'btn-outline border-base-300 hover:bg-base-200'
                }`}
              >
                🛠️ Admin Panel
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEpicViewEnabled(true)
                setSelectedEpicId(null)
                setShow2FASettings(false)
                setShowAdminPage(false)
              }}
              className={`btn btn-sm btn-block justify-start capitalize ${
                epicViewEnabled ? 'btn-primary text-white' : 'btn-ghost'
              }`}
            >
              💎 Epic Tracking
            </button>
            <button
              type="button"
              onClick={() => {
                setShow2FASettings(true)
                setShowAdminPage(false)
                setEpicViewEnabled(false)
              }}
              className={`btn btn-sm btn-block justify-start capitalize ${
                show2FASettings ? 'btn-primary text-white' : 'btn-ghost'
              }`}
            >
              ⚙️ {t('settings.title')}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('token')
                setToken(null)
                setUser(null)
                window.location.href = '/'
              }}
              className="btn btn-ghost btn-sm btn-block justify-start text-error hover:bg-error/10 capitalize"
            >
              🚪 Log Out
            </button>
          </div>

          {/* Accent Pickers */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/50 block">
              Accent Color
            </span>
            <div className="grid grid-cols-6 gap-2">
              {accents.map((acc) => (
                <button
                  key={acc.name}
                  type="button"
                  onClick={() => setAccentColor(acc.name)}
                  className={`w-6 h-6 rounded-full ${acc.color} transition-all duration-200 hover:scale-110 active:scale-95 ${
                    accentColor === acc.name ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  title={acc.label}
                  aria-label={`Accent ${acc.label}`}
                />
              ))}
            </div>
          </div>

          {/* Theme Dropdown */}
          <div className="dropdown dropdown-top dropdown-end w-full">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-outline btn-primary btn-sm btn-block capitalize justify-between"
            >
              🎨 Theme: {theme}
              <span>▾</span>
            </button>
            <ul className="dropdown-content menu bg-base-200 rounded-box z-[1] w-full p-2 shadow-lg gap-1 border border-base-300">
              <li>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={theme === 'light' ? 'active font-bold' : ''}
                >
                  ☀️ Light
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={theme === 'dark' ? 'active font-bold' : ''}
                >
                  🌙 Dark
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={theme === 'system' ? 'active font-bold' : ''}
                >
                  💻 System
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {showAdminPage && user?.is_super_admin ? (
          <div className="flex-1 overflow-y-auto z-10 bg-base-100">
            <AdminDashboardPage onBack={() => setShowAdminPage(false)} />
          </div>
        ) : show2FASettings ? (
          <div className="flex-1 overflow-y-auto z-10 bg-base-100">
            <SettingsPage onBack={() => setShow2FASettings(false)} />
          </div>
        ) : epicViewEnabled && activeWorkspace ? (
          <div className="flex-1 overflow-y-auto z-10 bg-base-100 p-8">
            {selectedEpicId ? (
              <EpicDetail
                workspaceId={activeWorkspace.id}
                epicId={selectedEpicId}
                onBack={() => setSelectedEpicId(null)}
              />
            ) : (
              <EpicList
                workspace={activeWorkspace}
                onSelectEpic={(id) => setSelectedEpicId(id)}
              />
            )}
          </div>
        ) : (
          <>

            {/* Top Board Bar */}
            <header className="navbar bg-base-100 border-b border-base-200/50 px-6 justify-between z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-base-content/90">
                    {activeBoard ? activeBoard.title : 'Loading Board...'}
                  </h2>
                  {activeBoard && (
                    <button
                      type="button"
                      onClick={() => toggleStarBoard(activeBoard.id)}
                      className={`text-lg focus:outline-none hover:scale-110 transition-transform ${
                        activeBoard.is_starred ? 'text-yellow-500' : 'text-base-content/30 hover:text-yellow-500'
                      }`}
                      title={activeBoard.is_starred ? 'Unstar Board' : 'Star Board'}
                    >
                      {activeBoard.is_starred ? '★' : '☆'}
                    </button>
                  )}
                </div>

                {/* Board Visibility Selector */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      disabled={userRole === 'observer'}
                      className="btn btn-outline btn-xs uppercase tracking-wider font-semibold"
                    >
                      👁️ {activeBoard.visibility}
                    </button>
                    {userRole !== 'observer' && (
                      <ul className="dropdown-content menu bg-base-200 rounded-box z-[1] w-40 p-2 shadow-lg gap-1 border border-base-300 mt-1">
                        <li>
                          <button
                            type="button"
                            onClick={() => updateBoardVisibility(activeBoard.id, 'private')}
                            className={activeBoard.visibility === 'private' ? 'active' : ''}
                          >
                            Private
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => updateBoardVisibility(activeBoard.id, 'workspace-only')}
                            className={activeBoard.visibility === 'workspace-only' ? 'active' : ''}
                          >
                            Workspace Only
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => updateBoardVisibility(activeBoard.id, 'public')}
                            className={activeBoard.visibility === 'public' ? 'active' : ''}
                          >
                            Public
                          </button>
                        </li>
                        <li className="border-t border-base-300 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Move this board to Trash?')) {
                                deleteBoard(activeBoard.id)
                              }
                            }}
                            className="text-error font-semibold hover:bg-error/10"
                          >
                            🗑️ Delete Board
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                )}

                {/* Board Sorting Options */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider"
                    >
                      排序 / Sort: {currentSort === 'votes' ? '👍 Votes' : '📋 Default'}
                    </button>
                    <ul className="dropdown-content menu bg-base-200 rounded-box z-[1] w-40 p-2 shadow-lg gap-1 border border-base-300 mt-1">
                      <li>
                        <button
                          type="button"
                          onClick={() => setSort(null)}
                          className={currentSort === null ? 'active' : ''}
                        >
                          Default
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => setSort('votes')}
                          className={currentSort === 'votes' ? 'active' : ''}
                        >
                          👍 Vote Count
                        </button>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Board Export Options */}
                {activeBoard && (
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(true)}
                    className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider text-base-content/85 hover:bg-base-200"
                  >
                    📤 Export
                  </button>
                )}

                {/* Board Custom Fields Manager */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider"
                    >
                      ⚙️ Custom Fields
                    </button>
                    <div className="dropdown-content menu bg-base-200 rounded-box z-[1] w-80 p-3 shadow-lg gap-2 border border-base-300 mt-1 max-h-[400px] overflow-y-auto">
                      <CustomFieldEditor boardId={activeBoard.id} disabled={userRole === 'observer'} />
                    </div>
                  </div>
                )}

                {/* Board Automations Manager */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider"
                    >
                      🤖 Automations
                    </button>
                    <div className="dropdown-content menu bg-base-200 rounded-box z-[1] w-96 p-3 shadow-lg gap-2 border border-base-300 mt-1 max-h-[500px] overflow-y-auto">
                      <AutomationList
                        boardId={activeBoard.id}
                        lists={activeBoard.lists || []}
                        labels={labels}
                        members={boardMembers}
                        disabled={userRole === 'observer'}
                      />
                    </div>
                  </div>
                )}

                {/* Sprints Board Mode Button */}
                {activeBoard && (
                  <button
                    type="button"
                    onClick={() => setSprintViewEnabled(!sprintViewEnabled)}
                    className={`btn btn-xs gap-1 font-semibold uppercase tracking-wider ${
                      sprintViewEnabled ? 'btn-primary text-white' : 'btn-outline'
                    }`}
                  >
                    🏃 Sprints Mode: {sprintViewEnabled ? 'ON' : 'OFF'}
                  </button>
                )}

                {/* Sprints Tab Switchers */}
                {activeBoard && sprintViewEnabled && (
                  <div className="join border border-base-300">
                    <button
                      type="button"
                      onClick={() => setSprintTab('board')}
                      className={`join-item btn btn-xs ${sprintTab === 'board' ? 'btn-active btn-primary text-white' : 'btn-ghost'}`}
                    >
                      Active Sprint
                    </button>
                    <button
                      type="button"
                      onClick={() => setSprintTab('planning')}
                      className={`join-item btn btn-xs ${sprintTab === 'planning' ? 'btn-active btn-primary text-white' : 'btn-ghost'}`}
                    >
                      Planning / Backlog
                    </button>
                    <button
                      type="button"
                      onClick={() => setSprintTab('burndown')}
                      className={`join-item btn btn-xs ${sprintTab === 'burndown' ? 'btn-active btn-primary text-white' : 'btn-ghost'}`}
                    >
                      Burndown Chart
                    </button>
                  </div>
                )}

                {/* Board Labels Manager */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider"
                    >
                      🏷️ Labels
                    </button>
                    <div className="dropdown-content menu bg-base-200 rounded-box z-[1] w-64 p-3 shadow-lg gap-2 border border-base-300 mt-1">
                      <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">
                        Board Labels
                      </span>
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {labels.map((l) => (
                          <span
                              key={l.id}
                              style={{ backgroundColor: l.color }}
                              className="badge text-white border-none text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                          >
                            {l.name}
                          </span>
                        ))}
                        {labels.length === 0 && (
                          <span className="text-xs text-base-content/40">No labels created</span>
                        )}
                      </div>
                      {userRole !== 'observer' && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.currentTarget
                            const name = (form.elements.namedItem('labelName') as HTMLInputElement).value
                            const color = (form.elements.namedItem('labelColor') as HTMLInputElement)
                              .value
                            if (name && color) {
                              createLabel(activeBoard.id, name, color)
                              form.reset()
                            }
                          }}
                          className="space-y-2 pt-2 border-t border-base-300"
                        >
                          <input
                            name="labelName"
                            type="text"
                            placeholder="New label name..."
                            className="input input-xs input-bordered w-full focus:outline-none"
                            required
                          />
                          <div className="flex items-center justify-between gap-2">
                            <input
                              name="labelColor"
                              type="color"
                              defaultValue="#4f46e5"
                              className="w-8 h-6 rounded cursor-pointer border-none bg-transparent"
                            />
                            <button type="submit" className="btn btn-primary btn-xs flex-1 text-white">
                              Add Label
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Archive Manager */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      onClick={loadArchive}
                      className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider"
                    >
                      📦 Archive
                    </button>
                    <div className="dropdown-content menu bg-base-200 rounded-box z-[1] w-72 p-3 shadow-lg gap-2 border border-base-300 mt-1 max-h-[300px] overflow-y-auto">
                      <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">
                        Archived Items
                      </span>

                      {/* Lists */}
                      {archivedItems.lists.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-warning uppercase">Columns</span>
                          {archivedItems.lists.map((l) => (
                            <div
                              key={l.id}
                              className="flex items-center justify-between gap-2 bg-base-100 p-1.5 rounded border border-base-300"
                            >
                              <span className="text-xs truncate font-medium">{l.title}</span>
                              {userRole !== 'observer' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await restoreList(l.id)
                                    loadArchive()
                                  }}
                                  className="btn btn-xs btn-primary text-white"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cards */}
                      {archivedItems.cards.length > 0 && (
                        <div className="space-y-1 pt-1.5 border-t border-base-300">
                          <span className="text-[9px] font-bold text-warning uppercase">Cards</span>
                          {archivedItems.cards.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 bg-base-100 p-1.5 rounded border border-base-300"
                            >
                              <span className="text-xs truncate font-medium">{c.title}</span>
                              {userRole !== 'observer' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await restoreCard(c.id)
                                    loadArchive()
                                  }}
                                  className="btn btn-xs btn-primary text-white"
                                >
                                  Restore
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {archivedItems.lists.length === 0 && archivedItems.cards.length === 0 && (
                        <span className="text-xs text-base-content/40 py-2 text-center">
                          No archived items
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Trash Manager */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      onClick={loadTrash}
                      className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider text-error hover:bg-error/10 hover:border-error"
                    >
                      🗑️ Trash
                    </button>
                    <div className="dropdown-content menu bg-base-200 rounded-box z-[1] w-80 p-3 shadow-lg gap-2 border border-base-300 mt-1 max-h-[300px] overflow-y-auto">
                      <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">
                        Trash Bin (Auto-deletes in 30 days)
                      </span>

                      {/* Lists */}
                      {trashedItems.lists.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-error uppercase">Columns</span>
                          {trashedItems.lists.map((l) => (
                            <div
                              key={l.id}
                              className="flex items-center justify-between gap-2 bg-base-100 p-1.5 rounded border border-base-300"
                            >
                              <span className="text-xs truncate font-medium">{l.title}</span>
                              {userRole !== 'observer' && (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await restoreList(l.id)
                                      loadTrash()
                                    }}
                                    className="btn btn-xs btn-primary text-white"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm('Permanently delete list and all its cards?')) {
                                        await deleteListPermanently(l.id)
                                        loadTrash()
                                      }
                                    }}
                                    className="btn btn-xs btn-error text-white"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cards */}
                      {trashedItems.cards.length > 0 && (
                        <div className="space-y-1 pt-1.5 border-t border-base-300">
                          <span className="text-[9px] font-bold text-error uppercase">Cards</span>
                          {trashedItems.cards.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 bg-base-100 p-1.5 rounded border border-base-300"
                            >
                              <span className="text-xs truncate font-medium">{c.title}</span>
                              {userRole !== 'observer' && (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await restoreCard(c.id)
                                      loadTrash()
                                    }}
                                    className="btn btn-xs btn-primary text-white"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm('Permanently delete card?')) {
                                        await deleteCardPermanently(c.id)
                                        loadTrash()
                                      }
                                    }}
                                    className="btn btn-xs btn-error text-white"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {trashedItems.lists.length === 0 && trashedItems.cards.length === 0 && (
                        <span className="text-xs text-base-content/40 py-2 text-center">
                          Trash is empty
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Board Members & Roles Selector */}
                {activeBoard && (
                  <div className="dropdown dropdown-bottom">
                    <button
                      type="button"
                      tabIndex={0}
                      className="btn btn-outline btn-xs gap-1 font-semibold uppercase tracking-wider"
                    >
                      👥 Members ({boardMembers.length})
                    </button>
                    <div className="dropdown-content menu bg-base-200 rounded-box z-[1] w-72 p-3 shadow-lg gap-2 border border-base-300 mt-1 max-h-[350px] overflow-y-auto">
                      <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">
                        Board Members
                      </span>
                      <div className="space-y-1.5 py-1">
                        {boardMembers.map((member) => (
                          <div key={member.user_id} className="flex items-center justify-between text-xs bg-base-100 p-1.5 rounded border border-base-300">
                            <span className="truncate max-w-[150px]" title={member.email}>{member.email}</span>
                            <span className="badge badge-xs uppercase font-bold">{member.role}</span>
                          </div>
                        ))}
                      </div>

                      {userRole === 'admin' && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const form = e.currentTarget
                            const email = (form.elements.namedItem('inviteEmail') as HTMLInputElement).value
                            const role = (form.elements.namedItem('inviteRole') as HTMLSelectElement).value
                            if (email && role) {
                              try {
                                await inviteBoardMember(activeBoard.id, email, role)
                                form.reset()
                                alert('Member invited successfully!')
                              } catch (err: any) {
                                alert(err.response?.data?.error || 'Failed to invite member.')
                              }
                            }
                          }}
                          className="space-y-2 pt-2 border-t border-base-300"
                        >
                          <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">
                            Invite New Member
                          </span>
                          <input
                            name="inviteEmail"
                            type="email"
                            placeholder="user@example.com"
                            className="input input-xs input-bordered w-full focus:outline-none"
                            required
                          />
                          <div className="flex gap-2">
                            <select
                              name="inviteRole"
                              className="select select-xs select-bordered flex-1 focus:outline-none"
                              defaultValue="observer"
                            >
                              <option value="admin">Admin</option>
                              <option value="observer">Observer</option>
                            </select>
                            <button type="submit" className="btn btn-primary btn-xs text-white">
                              Invite
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <ActiveTimerIndicator />
                <PresenceIndicator users={onlineUsers} />
                <span className="text-xs text-base-content/50">
                  Active Workspace: {activeWorkspace ? activeWorkspace.name : 'None'}
                </span>
              </div>
            </header>

            {/* Conditional Sprints or Columns Board view */}
            {sprintViewEnabled && activeBoard ? (
              <div className="flex-1 p-6 overflow-y-auto">
                {sprintTab === 'board' && (
                  (() => {
                    const activeSprint = sprints.find((s) => s.status === 'active')
                    if (activeSprint) {
                      return <SprintBoard sprint={activeSprint} lists={activeBoard.lists || []} />
                    }
                    return (
                      <div className="text-center py-12 bg-base-100 border border-base-200 rounded-2xl shadow-sm space-y-3">
                        <span className="text-sm font-semibold text-base-content/65 block">No active sprint running</span>
                        <button
                          type="button"
                          onClick={() => setSprintTab('planning')}
                          className="btn btn-primary btn-sm text-white"
                        >
                          Go to Sprint Planning
                        </button>
                      </div>
                    )
                  })()
                )}

                {sprintTab === 'planning' && (
                  (() => {
                    // Collect all cards for the board (across all lists)
                    const allCards: Card[] = []
                    for (const list of activeBoard.lists || []) {
                      for (const card of list.cards || []) {
                        allCards.push(card)
                      }
                    }
                    return (
                      <SprintPlanning
                        sprints={sprints}
                        backlogCards={allCards}
                        onAssignSprint={handleAssignSprint}
                        onCreateSprint={handleCreateSprint}
                        onDeleteSprint={handleDeleteSprint}
                        onStartSprint={handleStartSprint}
                        onCompleteSprint={handleCompleteSprint}
                        disabled={userRole === 'observer'}
                      />
                    )
                  })()
                )}

                {sprintTab === 'burndown' && (
                  (() => {
                    const activeSprint = sprints.find((s) => s.status === 'active') || sprints.find((s) => s.status === 'completed')
                    if (activeSprint) {
                      return <BurndownChart boardId={activeBoard.id} sprintId={activeSprint.id} />
                    }
                    return (
                      <div className="text-center py-12 bg-base-100 border border-base-200 rounded-2xl shadow-sm">
                        <span className="text-xs text-base-content/40 italic">Create or activate a sprint to view burndown statistics.</span>
                      </div>
                    )
                  })()
                )}
              </div>
            ) : (
              <DndContext onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-x-auto p-6 flex gap-6 items-start">
                  {activeBoard?.lists?.map((list) => (
                    <BoardColumn key={list.id} list={list} />
                  ))}

                  {/* Add Column Button */}
                  {activeBoard && (
                    <div className="w-80 flex-shrink-0">
                      {isAddingColumn ? (
                        <form
                          onSubmit={handleCreateColumn}
                          className="bg-base-100 border border-base-200 rounded-2xl p-4 shadow-md space-y-2"
                        >
                          <input
                            type="text"
                            placeholder="Enter list title..."
                            value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                            className="input input-sm input-bordered input-primary w-full focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary btn-xs flex-1">
                              Add List
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingColumn(false)
                                setNewColumnTitle('')
                              }}
                              className="btn btn-ghost btn-xs flex-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingColumn(true)}
                          className="btn btn-block bg-base-100/60 hover:bg-base-100 border border-dashed border-base-content/10 hover:border-primary/40 rounded-2xl p-4 text-left font-semibold text-sm text-base-content/60 hover:text-primary transition-all duration-200 flex items-center gap-2 h-14"
                        >
                          + Add List
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </DndContext>
            )}
          </>
        )}
      </main>
      
      {activeBoard && (
        <ExportDialog
          boardId={activeBoard.id}
          boardTitle={activeBoard.title}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  )
}

export default App
