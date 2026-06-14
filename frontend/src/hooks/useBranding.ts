import { useBrandingContext } from '../components/shared/BrandingProvider'

export interface BrandingConfig {
  appName: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
}

export function useBranding(): BrandingConfig {
  const { branding } = useBrandingContext()

  return {
    appName: branding?.app_name || 'Flux',
    logoUrl: branding?.logo_url || null,
    faviconUrl: branding?.favicon_url || null,
    primaryColor: branding?.primary_color || '#2563EB',
    secondaryColor: branding?.secondary_color || '#7C3AED',
  }
}
