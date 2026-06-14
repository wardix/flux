import React, { useEffect, useRef, useState } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { useSearchStore } from '../../stores/searchStore'
import { SearchResultsDropdown } from './SearchResultsDropdown'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut'

interface SearchBarProps {
  onSearch?: (query: string) => void
  isLoading?: boolean
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localQuery, setLocalQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { searchResults, isSearching, searchGlobal, clearSearch } = useSearchStore()

  useKeyboardShortcut('/', (e) => {
    e.preventDefault()
    inputRef.current?.focus()
  }, { description: 'Focus Search Bar', category: 'General' })

  // Handle local query debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(localQuery)
      } else {
        searchGlobal(localQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localQuery, onSearch, searchGlobal])

  // Clear search on Escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setLocalQuery('')
      clearSearch()
      setDropdownOpen(false)
      inputRef.current?.blur()
    }
  }

  // Click outside detection to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showLoader = isLoading !== undefined ? isLoading : isSearching

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 h-4 text-neutral-400 dark:text-neutral-500" />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value)
            setDropdownOpen(true)
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search... (Press '/' to focus)"
          className="input input-bordered input-sm w-full pl-9 pr-9 focus:outline-none focus:border-primary text-xs bg-base-100 border-base-300 dark:border-neutral-800 rounded-xl"
        />
        {showLoader ? (
          <Loader2
            data-testid="search-spinner"
            className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-neutral-400"
          />
        ) : localQuery ? (
          <button
            type="button"
            onClick={() => {
              setLocalQuery('')
              clearSearch()
              setDropdownOpen(false)
            }}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {dropdownOpen && localQuery.trim().length >= 2 && (
        <SearchResultsDropdown
          results={searchResults}
          isLoading={showLoader}
          isOpen={dropdownOpen}
          onSelect={() => {
            setDropdownOpen(false)
          }}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </div>
  )
}
export default SearchBar
