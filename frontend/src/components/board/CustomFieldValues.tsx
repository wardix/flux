import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { CustomField, CustomFieldValueData } from '../../lib/types'

interface CustomFieldValuesProps {
  cardId: number
  boardId: number
  disabled?: boolean
}

export function CustomFieldValues({ cardId, boardId, disabled = false }: CustomFieldValuesProps) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [values, setValues] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get all custom fields defined for the board
      const fieldsRes = await api.get<{ data: CustomField[] }>(`/boards/${boardId}/custom-fields`)
      setFields(fieldsRes.data || [])

      // Get values for this card
      const valuesRes = await api.get<{ data: CustomFieldValueData[] }>(
        `/cards/${cardId}/custom-fields`,
      )
      const valuesMap: Record<number, string> = {}
      for (const item of valuesRes.data || []) {
        valuesMap[item.field_id] = item.value ?? ''
      }
      setValues(valuesMap)
    } catch (err: any) {
      setError(err.message || 'Failed to load custom fields data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [cardId, boardId])

  const handleValueChange = (fieldId: number, value: string) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
    setSuccess(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    // Validate required fields
    for (const field of fields) {
      if (field.is_required) {
        const val = values[field.id]
        if (field.field_type === 'checkbox' ? val !== 'true' : !val || val.trim() === '') {
          setError(`Field "${field.name}" is required.`)
          setSaving(false)
          return
        }
      }
      // Check number format
      if (field.field_type === 'number') {
        const val = values[field.id]
        if (val && val.trim() !== '' && Number.isNaN(Number(val))) {
          setError(`Field "${field.name}" must be a valid number.`)
          setSaving(false)
          return
        }
      }
    }

    try {
      const payload = fields.map((f) => ({
        field_id: f.id,
        value: values[f.id] === undefined || values[f.id] === '' ? null : values[f.id],
      }))
      await api.put(`/cards/${cardId}/custom-fields`, { values: payload })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to save custom field values')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-xs text-base-content/50">Loading custom fields...</div>
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 border-t border-base-200 pt-3">
      <span className="text-xs text-base-content/50 font-bold uppercase block mb-1">
        Custom Fields
      </span>

      {error && (
        <div className="alert alert-error text-xs py-1.5 rounded">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success text-xs py-1.5 rounded">
          <span>Custom fields saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((field) => {
          const val = values[field.id] ?? ''

          return (
            <div key={field.id} className="form-control w-full">
              <label className="label py-0.5">
                <span className="label-text text-xs font-semibold">
                  {field.name}
                  {field.is_required && <span className="text-error ml-1">*</span>}
                </span>
              </label>

              {field.field_type === 'checkbox' ? (
                <div className="flex items-center gap-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={val === 'true'}
                    disabled={disabled}
                    onChange={(e) =>
                      handleValueChange(field.id, e.target.checked ? 'true' : 'false')
                    }
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <span className="text-xs text-base-content/70">Yes / No</span>
                </div>
              ) : field.field_type === 'dropdown' ? (
                <select
                  value={val}
                  disabled={disabled}
                  onChange={(e) => handleValueChange(field.id, e.target.value)}
                  className="select select-sm select-bordered w-full focus:outline-none focus:select-primary"
                  role="combobox"
                >
                  <option value="">-- Select Option --</option>
                  {field.options?.choices?.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              ) : field.field_type === 'date' ? (
                <input
                  type="date"
                  value={val}
                  disabled={disabled}
                  onChange={(e) => handleValueChange(field.id, e.target.value)}
                  className="input input-sm input-bordered w-full focus:outline-none"
                />
              ) : field.field_type === 'number' ? (
                <input
                  type="text"
                  value={val}
                  disabled={disabled}
                  placeholder="Enter number..."
                  onChange={(e) => handleValueChange(field.id, e.target.value)}
                  className="input input-sm input-bordered w-full focus:outline-none focus:input-primary"
                />
              ) : (
                <input
                  type="text"
                  value={val}
                  disabled={disabled}
                  placeholder="Enter text..."
                  onChange={(e) => handleValueChange(field.id, e.target.value)}
                  className="input input-sm input-bordered w-full focus:outline-none focus:input-primary"
                />
              )}
            </div>
          )
        })}
      </div>

      {!disabled && (
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving} className="btn btn-primary btn-xs text-white">
            {saving ? 'Saving Fields...' : 'Save Fields'}
          </button>
        </div>
      )}
    </form>
  )
}
