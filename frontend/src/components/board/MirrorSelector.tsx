import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Board, CardMirror, List } from '../../lib/types'

interface MirrorSelectorProps {
  cardId: number
  currentBoardId: number
  onMirrorCreated: (mirror: CardMirror) => void
  onClose: () => void
}

export const MirrorSelector: React.FC<MirrorSelectorProps> = ({
  cardId,
  currentBoardId,
  onMirrorCreated,
  onClose,
}) => {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [loadingLists, setLoadingLists] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBoards = async () => {
      setLoadingBoards(true)
      try {
        const res = await api.get<{ data: Board[] }>('/boards')
        setBoards(res.data || [])
      } catch (err) {
        console.error('Failed to load boards', err)
        setError('Gagal memuat daftar board')
      } finally {
        setLoadingBoards(false)
      }
    }
    fetchBoards()
  }, [])

  useEffect(() => {
    if (!selectedBoardId) {
      setLists([])
      setSelectedListId(null)
      return
    }

    const fetchLists = async () => {
      setLoadingLists(true)
      setError(null)
      try {
        const res = await api.get<{ data: Board }>(`/boards/${selectedBoardId}`)
        setLists(res.data?.lists || [])
        if (res.data?.lists && res.data.lists.length > 0) {
          setSelectedListId(res.data.lists[0].id)
        } else {
          setSelectedListId(null)
        }
      } catch (err) {
        console.error('Failed to load lists', err)
        setError('Gagal memuat daftar list untuk board ini')
      } finally {
        setLoadingLists(false)
      }
    }
    fetchLists()
  }, [selectedBoardId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoardId || !selectedListId) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await api.post<{ data: CardMirror }>(`/cards/${cardId}/mirror`, {
        target_board_id: selectedBoardId,
        target_list_id: selectedListId,
        position: 0,
      })
      onMirrorCreated(res.data)
      onClose()
    } catch (err: any) {
      console.error('Failed to create mirror', err)
      setError(
        err.message ||
          'Gagal membuat mirror card. Pastikan tidak menduplikasi mirror di list yang sama.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal modal-open z-55">
      <div className="modal-box bg-base-100 border border-base-200 shadow-2xl relative max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-primary mb-4">Mirror Card ke Board Lain</h3>

        {error && (
          <div className="alert alert-error text-xs py-2 mb-3">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label text-xs font-bold uppercase text-base-content/60">
              Pilih Board Tujuan
            </label>
            {loadingBoards ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <select
                className="select select-bordered select-sm w-full"
                value={selectedBoardId || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedBoardId(val ? Number(val) : null)
                }}
                required
              >
                <option value="">-- Pilih Board --</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} {b.id === currentBoardId ? '(Board ini)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedBoardId && (
            <div>
              <label className="label text-xs font-bold uppercase text-base-content/60">
                Pilih List Tujuan
              </label>
              {loadingLists ? (
                <div className="loading loading-spinner loading-sm"></div>
              ) : lists.length === 0 ? (
                <p className="text-xs text-error font-medium">Board ini belum memiliki list.</p>
              ) : (
                <select
                  className="select select-bordered select-sm w-full"
                  value={selectedListId || ''}
                  onChange={(e) => setSelectedListId(Number(e.target.value))}
                  required
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={submitting || !selectedBoardId || !selectedListId}
            >
              {submitting ? 'Membuat...' : 'Create Mirror'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
