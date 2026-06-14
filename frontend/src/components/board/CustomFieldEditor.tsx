import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { CustomField } from '../../lib/types'

interface CustomFieldEditorProps {
  boardId: number
  disabled?: boolean
}

export function CustomFieldEditor({ boardId, disabled = false }: CustomFieldEditorProps) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New Field Form States
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date' | 'dropdown' | 'checkbox'>(
    'text',
  )
  const [choicesStr, setChoicesStr] = useState('')
  const [isRequired, setIsRequired] = useState(false)

  const fetchFields = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ data: CustomField[] }>(`/boards/${boardId}/custom-fields`)
      setFields(res.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch custom fields')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFields()
  }, [boardId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)

    let options: { choices: string[] } | null = null
    if (fieldType === 'dropdown') {
      const choices = choicesStr
        .split('\n')
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
      if (choices.length === 0) {
        setError('Dropdown type requires at least one choice (one per line)')
        return
      }
      options = { choices }
    }

    try {
      await api.post(`/boards/${boardId}/custom-fields`, {
        name: name.trim(),
        field_type: fieldType,
        options,
        is_required: isRequired,
        position: fields.length,
      })
      setName('')
      setChoicesStr('')
      setIsRequired(false)
      fetchFields()
    } catch (err: any) {
      setError(err.message || 'Failed to create custom field')
    }
  }

  const handleDelete = async (fieldId: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this custom field? This will delete all associated values on cards!',
      )
    ) {
      return
    }
    setError(null)
    try {
      await api.delete(`/boards/${boardId}/custom-fields/${fieldId}`)
      fetchFields()
    } catch (err: any) {
      setError(err.message || 'Failed to delete custom field')
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-sm text-base-content/70 uppercase tracking-wide">
        Custom Fields
      </h4>

      {error && (
        <div className="alert alert-error text-xs py-2 rounded">
          <span>{error}</span>
        </div>
      )}

      {/* List existing fields */}
      {loading ? (
        <div className="text-xs text-base-content/50">Loading fields...</div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between bg-base-100 p-2.5 rounded-lg border border-base-200 shadow-sm"
            >
              <div>
                <span className="font-semibold text-sm text-base-content/90">{field.name}</span>
                <div className="flex gap-2 mt-0.5">
                  <span className="badge badge-sm badge-outline capitalize text-[10px]">
                    Type: {field.field_type}
                  </span>
                  {field.is_required && (
                    <span className="badge badge-sm badge-warning text-[10px] text-white">
                      Required
                    </span>
                  )}
                  {field.field_type === 'dropdown' && field.options?.choices && (
                    <span className="text-[10px] text-base-content/50">
                      Choices: {field.options.choices.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDelete(field.id)}
                  className="btn btn-xs btn-error btn-outline"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-xs text-base-content/40 italic">No custom fields defined yet.</div>
          )}
        </div>
      )}

      {/* Add custom field form */}
      {!disabled && (
        <form
          onSubmit={handleCreate}
          className="bg-base-200/50 p-4 rounded-xl space-y-3 border border-base-200"
        >
          <span className="text-xs font-bold text-base-content/60 uppercase block">
            Add New Custom Field
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label py-0.5">
                <span className="label-text text-xs">Field Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priority, Version, Estimate"
                className="input input-sm input-bordered w-full"
                required
              />
            </div>
            <div>
              <label className="label py-0.5">
                <span className="label-text text-xs">Field Type</span>
              </label>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as any)}
                className="select select-sm select-bordered w-full"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="dropdown">Dropdown</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </div>
          </div>

          {fieldType === 'dropdown' && (
            <div>
              <label className="label py-0.5">
                <span className="label-text text-xs">Dropdown Choices (One per line)</span>
              </label>
              <textarea
                value={choicesStr}
                onChange={(e) => setChoicesStr(e.target.value)}
                placeholder="High&#10;Medium&#10;Low"
                className="textarea textarea-sm textarea-bordered w-full font-mono text-xs h-20"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequiredCheck"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary"
            />
            <label htmlFor="isRequiredCheck" className="text-xs select-none cursor-pointer">
              Mark as Required field on cards
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-sm w-full text-white">
            Create Custom Field
          </button>
        </form>
      )}
    </div>
  )
}
