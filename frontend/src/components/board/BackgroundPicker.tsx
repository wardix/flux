import type React from 'react'
import { useState } from 'react'
import { BOARD_BG_COLORS } from '../../lib/constants'
import { ColorGrid } from '../shared/ColorGrid'
import { UnsplashSearch } from '../shared/UnsplashSearch'

interface BackgroundPickerProps {
  currentBgColor: string | null
  currentBgImageUrl: string | null
  onSelectColor: (color: string) => void
  onSelectImage: (url: string) => void
  onRemove: () => void
  isOpen: boolean
  onClose: () => void
}

export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
  currentBgColor,
  currentBgImageUrl,
  onSelectColor,
  onSelectImage,
  onRemove,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'photos'>('colors')

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-12 w-72 bg-base-100 border border-base-200 shadow-xl rounded-2xl p-4 z-50 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-base-200 pb-2">
        <h3 className="text-sm font-bold text-base-content">Ubah Background Board</h3>
        <button type="button" className="btn btn-xs btn-ghost btn-circle" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200/50 p-1 grid grid-cols-2">
        <button
          type="button"
          className={`tab tab-sm font-semibold ${activeTab === 'colors' ? 'tab-active btn-primary text-white' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          Colors
        </button>
        <button
          type="button"
          className={`tab tab-sm font-semibold ${activeTab === 'photos' ? 'tab-active btn-primary text-white' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photos
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'colors' ? (
          <ColorGrid
            colors={BOARD_BG_COLORS}
            selectedColor={currentBgColor}
            onSelectColor={onSelectColor}
          />
        ) : (
          <UnsplashSearch onSelectImage={onSelectImage} />
        )}
      </div>

      {/* Actions */}
      {(currentBgColor || currentBgImageUrl) && (
        <div className="pt-2 border-t border-base-200">
          <button
            type="button"
            className="btn btn-xs btn-outline btn-error btn-block"
            onClick={onRemove}
          >
            Remove Background
          </button>
        </div>
      )}
    </div>
  )
}
