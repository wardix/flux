import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { WorkspaceBranding } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'
import { hexToHSL } from '../../lib/helpers'

interface BrandingContextType {
  branding: WorkspaceBranding | null
  loading: boolean
  refreshBranding: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeWorkspace = useBoardStore((s) => s.activeWorkspace)
  const [branding, setBranding] = useState<WorkspaceBranding | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshBranding = async () => {
    if (!activeWorkspace?.id) {
      setBranding(null)
      return
    }
    setLoading(true)
    try {
      const res = await api.get<{ data: WorkspaceBranding }>(`/workspaces/${activeWorkspace.id}/branding`)
      setBranding(res.data)
    } catch (err) {
      // Branding not set, fall back to default
      setBranding(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshBranding()
  }, [activeWorkspace?.id])

  useEffect(() => {
    const root = document.documentElement
    if (branding) {
      // Primary color DaisyUI theme variables
      root.style.setProperty('--p', hexToHSL(branding.primary_color || '#2563EB'))
      // Secondary color DaisyUI theme variables
      root.style.setProperty('--s', hexToHSL(branding.secondary_color || '#7C3AED'))
      
      // Update document title
      document.title = branding.app_name || 'Flux'

      // Update favicon
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (link && branding.favicon_url) {
        link.href = branding.favicon_url
      }
    } else {
      // Reset defaults
      root.style.removeProperty('--p')
      root.style.removeProperty('--s')
      document.title = 'Flux'
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (link) {
        link.href = '/favicon.ico'
      }
    }
  }, [branding])

  return (
    <BrandingContext.Provider value={{ branding, loading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBrandingContext = () => {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error('useBrandingContext must be used within BrandingProvider')
  }
  return context
}
