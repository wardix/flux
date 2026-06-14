import type React from 'react'
import { useEffect, useState } from 'react'
import type { CreateGoalRequest } from '../../lib/types'

interface CreateGoalModalProps {
  isOpen: boolean
  parentId?: number // jika buat Key Result
  workspaceId: number
  onSubmit: (data: CreateGoalRequest) => void
  onClose: () => void
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  parentId,
  workspaceId,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'objective' | 'key_result'>('objective')
  const [targetValue, setTargetValue] = useState<string>('')
  const [unit, setUnit] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (parentId) {
      setType('key_result')
    } else {
      setType('objective')
    }
  }, [parentId])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Judul sasaran wajib diisi')
      return
    }

    if (type === 'key_result' && !targetValue.trim()) {
      setError('Target Value wajib diisi untuk Key Result')
      return
    }

    const payload: CreateGoalRequest = {
      workspace_id: workspaceId,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      parent_id: parentId || null,
      target_value: targetValue ? Number(targetValue) : undefined,
      unit: unit.trim() || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      color: type === 'objective' ? color : undefined,
    }

    try {
      onSubmit(payload)
      // Reset
      setTitle('')
      setDescription('')
      setTargetValue('')
      setUnit('')
      setDueDate('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan sasaran')
    }
  }

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box bg-base-100 border border-base-200 shadow-2xl relative max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-primary mb-4">
          {parentId ? 'Tambah Key Result Baru' : 'Buat Objective Baru'}
        </h3>

        {error && (
          <div className="alert alert-error text-xs py-2 mb-3">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label text-xs font-bold uppercase text-base-content/60">
              Judul Sasaran
            </label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Tingkatkan User Retention atau Reduce churn to < 5%"
              required
            />
          </div>

          <div>
            <label className="label text-xs font-bold uppercase text-base-content/60">
              Deskripsi (Opsional)
            </label>
            <textarea
              className="textarea textarea-bordered textarea-sm w-full h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan detail dari sasaran ini..."
            />
          </div>

          {!parentId && (
            <div>
              <label className="label text-xs font-bold uppercase text-base-content/60">
                Tipe Sasaran
              </label>
              <select
                className="select select-bordered select-sm w-full"
                value={type}
                onChange={(e) => setType(e.target.value as 'objective' | 'key_result')}
              >
                <option value="objective">Objective (Kumpulan Key Results)</option>
                <option value="key_result">Key Result (Sasaran Terukur)</option>
              </select>
            </div>
          )}

          {type === 'key_result' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-xs font-bold uppercase text-base-content/60">
                  Target Value
                </label>
                <input
                  type="number"
                  step="any"
                  className="input input-bordered input-sm w-full"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Contoh: 100 atau 5"
                  required
                />
              </div>
              <div>
                <label className="label text-xs font-bold uppercase text-base-content/60">
                  Unit
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Contoh: % atau users"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs font-bold uppercase text-base-content/60">
                Tenggat Waktu
              </label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            {type === 'objective' && (
              <div>
                <label className="label text-xs font-bold uppercase text-base-content/60">
                  Warna Indikator
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    className="w-10 h-8 rounded border cursor-pointer p-0.5 bg-transparent"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <span className="text-xs uppercase font-mono text-base-content/60">{color}</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-sm btn-primary">
              Simpan Sasaran
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
