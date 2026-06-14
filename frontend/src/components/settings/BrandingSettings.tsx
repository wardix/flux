import React, { useState, useEffect } from 'react'
import { Upload, RotateCcw, Save, Globe, Info } from 'lucide-react'
import { api } from '../../lib/api'
import { useBrandingContext } from '../shared/BrandingProvider'

interface BrandingSettingsProps {
  workspaceId: number
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ workspaceId }) => {
  const { branding, refreshBranding } = useBrandingContext()

  const [appName, setAppName] = useState('Flux')
  const [primaryColor, setPrimaryColor] = useState('#2563EB')
  const [secondaryColor, setSecondaryColor] = useState('#7C3AED')
  const [customDomain, setCustomDomain] = useState('')
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (branding) {
      setAppName(branding.app_name)
      setPrimaryColor(branding.primary_color)
      setSecondaryColor(branding.secondary_color)
      setCustomDomain(branding.custom_domain || '')
      setLogoPreview(branding.logo_url)
      setFaviconPreview(branding.favicon_url)
    } else {
      setAppName('Flux')
      setPrimaryColor('#2563EB')
      setSecondaryColor('#7C3AED')
      setCustomDomain('')
      setLogoPreview(null)
      setFaviconPreview(null)
    }
    setLogoFile(null)
    setFaviconFile(null)
  }, [branding, workspaceId])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Logo file size exceeds 2MB limit')
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 500 * 1024) {
        setErrorMsg('Favicon file size exceeds 500KB limit')
        return
      }
      setFaviconFile(file)
      setFaviconPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      // 1. Update branding config
      await api.put(`/workspaces/${workspaceId}/branding`, {
        app_name: appName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        custom_domain: customDomain || null,
      })

      // 2. Upload Logo if selected
      if (logoFile) {
        const formData = new FormData()
        formData.append('file', logoFile)
        await api.post(`/workspaces/${workspaceId}/branding/logo`, formData)
      }

      // 3. Upload Favicon if selected
      if (faviconFile) {
        const formData = new FormData()
        formData.append('file', faviconFile)
        await api.post(`/workspaces/${workspaceId}/branding/favicon`, formData)
      }

      setSuccessMsg('Branding configurations saved successfully!')
      await refreshBranding()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.response?.data?.error || 'Failed to save branding configurations.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all branding settings to default?')) {
      return
    }
    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      await api.delete(`/workspaces/${workspaceId}/branding`)
      setSuccessMsg('Branding reset to system default!')
      await refreshBranding()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset branding settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="md:col-span-2 space-y-6">
        {successMsg && (
          <div className="p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {/* App Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              App Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              className="input input-bordered w-full text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. MyCompany PM"
            />
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Primary Theme Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 border border-neutral-200 dark:border-neutral-850 rounded-lg cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                  className="input input-bordered input-sm flex-1 text-xs uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Secondary Accent Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 border border-neutral-200 dark:border-neutral-850 rounded-lg cursor-pointer p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  required
                  className="input input-bordered input-sm flex-1 text-xs uppercase"
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Logo */}
            <div className="p-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Upload Logo
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  Max size 2MB (PNG, JPG, SVG)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Favicon */}
            <div className="p-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Upload Favicon
                </span>
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  Max size 500KB (ICO, PNG)
                </span>
                <input
                  type="file"
                  accept="image/x-icon, image/png, image/jpeg, image/jpg"
                  onChange={handleFaviconChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Custom Domain mapping */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Custom Domain mapping
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="pm.mycompany.com"
                className="input input-bordered w-full text-sm pl-10 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200/50 dark:border-neutral-900/50 rounded-lg flex gap-2.5 items-start">
              <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                To link your domain, create a DNS **CNAME** record pointing your subdomain (e.g. `pm`) to `app.flux.com`.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Branding
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="btn btn-outline btn-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </button>
        </div>
      </form>

      {/* Live Preview Panel */}
      <div className="p-5 bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-200 dark:border-neutral-850 rounded-2xl flex flex-col justify-between min-h-[300px]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-4">
            Live Preview
          </span>
          <div className="space-y-4">
            {/* Header / Brand Preview */}
            <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-6 object-contain" />
              ) : (
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-black text-xs"
                >
                  F
                </div>
              )}
              <span className="font-extrabold text-sm text-neutral-800 dark:text-neutral-200">
                {appName}
              </span>
            </div>

            {/* Accent Theme Color Indicators */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-neutral-400">Buttons & Badges preview</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  style={{ backgroundColor: primaryColor }}
                  className="px-3 py-1.5 text-xs text-white font-semibold rounded-lg shadow-sm"
                >
                  Primary Action
                </button>
                <button
                  type="button"
                  style={{ color: secondaryColor, borderColor: secondaryColor }}
                  className="px-3 py-1.5 text-xs border bg-transparent font-semibold rounded-lg"
                >
                  Secondary Action
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Favicon preview */}
        {faviconPreview && (
          <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-850">
            <img src={faviconPreview} alt="Favicon" className="w-4 h-4 object-contain" />
            <span className="text-[10px] text-neutral-400 font-semibold">Favicon applied</span>
          </div>
        )}
      </div>
    </div>
  )
}
