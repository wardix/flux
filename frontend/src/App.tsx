import { useEffect, useState } from 'react'
import { BoardColumn } from './components/board/BoardColumn'
import { useTheme } from './hooks/useTheme'
import { useBoardStore } from './stores/boardStore'

function App() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()
  const { boards, activeBoard, fetchBoards, fetchBoard, createBoard, createList } = useBoardStore()

  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [isAddingBoard, setIsAddingBoard] = useState(false)
  const [isAddingColumn, setIsAddingColumn] = useState(false)

  const accents = [
    { name: 'indigo', label: 'Indigo', color: 'bg-indigo-600' },
    { name: 'blue', label: 'Blue', color: 'bg-blue-600' },
    { name: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
    { name: 'rose', label: 'Rose', color: 'bg-rose-600' },
    { name: 'amber', label: 'Amber', color: 'bg-amber-600' },
    { name: 'violet', label: 'Violet', color: 'bg-violet-600' },
  ]

  // Fetch all boards on load
  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  // Select first board by default if activeBoard is not set
  useEffect(() => {
    if (boards.length > 0 && !activeBoard) {
      fetchBoard(boards[0].id)
    }
  }, [boards, activeBoard, fetchBoard])

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return
    await createBoard(newBoardTitle.trim())
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

  return (
    <div className="flex h-screen bg-base-300 text-base-content overflow-hidden selection:bg-primary selection:text-primary-content transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-base-100 flex flex-col border-r border-base-200/50">
        {/* Brand */}
        <div className="p-6 border-b border-base-200/50 flex items-center justify-between">
          <span className="text-2xl font-bold tracking-wider text-primary">⚡ Flux</span>
        </div>

        {/* Boards Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                My Boards
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
              {boards.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => fetchBoard(b.id)}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg text-left ${
                      activeBoard?.id === b.id
                        ? 'active bg-primary text-primary-content font-semibold'
                        : 'hover:bg-base-200'
                    }`}
                  >
                    <span className="truncate">📋 {b.title}</span>
                    <span className="text-[10px] uppercase opacity-60">{b.visibility}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Customization Footer */}
        <div className="p-4 border-t border-base-200/50 space-y-4 bg-base-200/20">
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

        {/* Top Board Bar */}
        <header className="navbar bg-base-100 border-b border-base-200/50 px-6 justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-base-content/90">
              {activeBoard ? activeBoard.title : 'Loading Board...'}
            </h2>
            {activeBoard && (
              <span className="badge badge-outline badge-sm capitalize text-[10px] tracking-wide font-medium">
                {activeBoard.visibility}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/50">Workspace ID: 1</span>
          </div>
        </header>

        {/* Columns Board view */}
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
      </main>
    </div>
  )
}

export default App
