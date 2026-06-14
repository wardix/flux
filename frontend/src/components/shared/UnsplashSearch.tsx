import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface UnsplashSearchProps {
  onSelectImage: (url: string) => void
}

export const UnsplashSearch: React.FC<UnsplashSearchProps> = ({ onSelectImage }) => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [images, setImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [query])

  // Fetch images
  useEffect(() => {
    if (!debouncedQuery) {
      // Load random photos on empty query
      setIsLoading(true)
      api
        .get<{ data: any[] }>('/unsplash/random?count=12')
        .then((res) => {
          setImages(res.data || [])
          setHasMore(false)
          setError(null)
        })
        .catch((err) => {
          console.error(err)
          setError('Gagal memuat gambar dari Unsplash. Pastikan API key terkonfigurasi.')
        })
        .finally(() => {
          setIsLoading(false)
        })
      return
    }

    setPage(1)
    setIsLoading(true)
    api
      .get<{ data: any[] }>(
        `/unsplash/search?q=${encodeURIComponent(debouncedQuery)}&page=1&per_page=12`,
      )
      .then((res) => {
        setImages(res.data || [])
        setHasMore((res.data || []).length === 12)
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        setError('Gagal memuat gambar pencarian dari Unsplash.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [debouncedQuery])

  const loadMore = () => {
    if (isLoading || !hasMore) return
    const nextPage = page + 1
    setIsLoading(true)
    api
      .get<{ data: any[] }>(
        `/unsplash/search?q=${encodeURIComponent(debouncedQuery)}&page=${nextPage}&per_page=12`,
      )
      .then((res) => {
        setImages((prev) => [...prev, ...(res.data || [])])
        setPage(nextPage)
        setHasMore((res.data || []).length === 12)
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        setError('Gagal memuat gambar lebih banyak.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        className="input input-bordered input-sm w-full"
        placeholder="Cari foto di Unsplash..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="text-[10px] text-error font-medium">{error}</p>}

      <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto p-0.5">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            className="w-full aspect-video rounded overflow-hidden relative group border border-base-200 focus:outline-none hover:scale-[1.03] transition-transform"
            onClick={() => onSelectImage(img.url_regular)}
          >
            <img src={img.url_thumb} alt="Unsplash option" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-1 transition-opacity">
              <span className="text-[8px] text-white/90 truncate font-semibold">
                By {img.photographer}
              </span>
            </div>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-2">
          <span className="loading loading-spinner loading-xs text-primary"></span>
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          type="button"
          className="btn btn-xs btn-outline btn-block text-[10px]"
          onClick={loadMore}
        >
          Load More
        </button>
      )}
    </div>
  )
}
