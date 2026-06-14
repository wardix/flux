import React, { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../../stores/uiStore'
import { useBoardStore } from '../../stores/boardStore'
import { api } from '../../lib/api'

interface SearchResultCard {
  id: number
  title: string
  board_id: number
  board_title?: string
}

export function CommandPalette() {
  const { isCommandPaletteOpen: isOpen, closeCommandPalette: close } = useUiStore()
  const navigate = useNavigate()
  
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultCard[]>([])
  
  const { activeBoard, createCard, boards, activeWorkspace } = useBoardStore()
  
  // Filter boards for the active workspace if needed, but since it's global navigation, we might show all boards or just boards in active workspace. Let's use activeWorkspace boards.
  const workspaceBoards = boards.filter(b => b.workspace_id === activeWorkspace?.id)

  useEffect(() => {
    if (search.length >= 2) {
      const fetchResults = async () => {
        try {
          const res = await api.get<{ data: SearchResultCard[] }>(`/search?q=${encodeURIComponent(search)}&per_page=5`)
          setSearchResults(res.data?.data || [])
        } catch (e) {
          console.error('Failed to search cards', e)
          setSearchResults([])
        }
      }
      const debounce = setTimeout(fetchResults, 300)
      return () => clearTimeout(debounce)
    } else {
      setSearchResults([])
    }
  }, [search])

  if (!isOpen) return null

  const handleCreateCard = () => {
    if (!activeBoard?.lists?.length) {
      alert("No active board or lists found.")
      return
    }
    const firstListId = activeBoard.lists[0].id
    const btn = document.querySelector(`[data-list-add-card="${firstListId}"]`) as HTMLButtonElement
    if (btn) btn.click()
  }

  const handleCreateBoard = () => {
    const btn = document.querySelector('[data-testid="create-board-btn"]') as HTMLButtonElement
    if (btn) btn.click()
    else alert('Please navigate to a workspace dashboard to create a board.')
  }

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => !open && close()}
      label="Command Palette"
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Type a command or search..."
      />
      <Command.List>
        <Command.Empty>
          No results found.
        </Command.Empty>

        <Command.Group heading="Actions">
          <Command.Item onSelect={() => { handleCreateCard(); close() }}>
            ➕ Create New Card
          </Command.Item>
          <Command.Item onSelect={() => { handleCreateBoard(); close() }}>
            📋 Create New Board
          </Command.Item>
          <Command.Item onSelect={() => { navigate('/'); close() }}>
            🏠 Go to Dashboard
          </Command.Item>
        </Command.Group>

        {workspaceBoards.length > 0 && (
          <Command.Group heading="Navigation" className="text-xs font-semibold text-base-content/50 px-2 py-1 mt-2 uppercase tracking-wider">
            {workspaceBoards.map(board => (
              <Command.Item
                key={board.id} onSelect={() => { navigate(`/boards/${board.id}`); close() }}>
                📋 {board.title}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {searchResults.length > 0 && (
          <Command.Group heading="Cards">
            {searchResults.map(card => (
              <Command.Item key={`card-${card.id}`} onSelect={() => { navigate(`/boards/${card.board_id}`); close() }}>
                🃏 
                <span>{card.title}</span>
                {card.board_title && (
                  <span className="text-xs opacity-50 ml-2">
                    {card.board_title}
                  </span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  )
}
