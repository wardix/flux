import { create } from 'zustand'
import { api } from '../lib/api'
import type { SearchResult, ActiveFilters } from '../lib/types'

interface SearchState {
  // Global search
  query: string
  searchResults: SearchResult[]
  isSearching: boolean
  searchError: string | null

  // Board filters (client-side)
  activeFilters: ActiveFilters
  isFilterPanelOpen: boolean

  // Actions
  setQuery: (query: string) => void
  searchGlobal: (query: string) => Promise<void>
  clearSearch: () => void
  setFilter: (filter: Partial<ActiveFilters>) => void
  clearFilters: () => void
  toggleFilterPanel: () => void
}

const initialFilters: ActiveFilters = {
  assigneeIds: [],
  labelIds: [],
  dueStatus: 'all',
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  searchResults: [],
  isSearching: false,
  searchError: null,

  activeFilters: initialFilters,
  isFilterPanelOpen: false,

  setQuery: (query) => set({ query }),

  searchGlobal: async (query) => {
    if (query.trim().length < 2) {
      set({ searchResults: [], isSearching: false, searchError: null })
      return
    }

    set({ isSearching: true, searchError: null })
    try {
      const res = await api.get<{ data: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`)
      set({ searchResults: res.data || [], isSearching: false })
    } catch (err: any) {
      console.error(err)
      set({ searchError: 'Search failed', isSearching: false })
    }
  },

  clearSearch: () => set({ query: '', searchResults: [], searchError: null, isSearching: false }),

  setFilter: (filter) =>
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        ...filter,
      },
    })),

  clearFilters: () => set({ activeFilters: initialFilters }),

  toggleFilterPanel: () => set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),
}))
