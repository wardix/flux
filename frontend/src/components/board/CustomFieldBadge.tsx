import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { CustomFieldValueData } from '../../lib/types'

interface CustomFieldBadgeProps {
  cardId: number
}

export function CustomFieldBadge({ cardId }: CustomFieldBadgeProps) {
  const [values, setValues] = useState<CustomFieldValueData[]>([])

  useEffect(() => {
    const fetchValues = async () => {
      try {
        const res = await api.get<{ data: CustomFieldValueData[] }>(`/cards/${cardId}/custom-fields`)
        // Filter out empty or null values
        const nonNull = (res.data || []).filter((item) => {
          if (item.value === null || item.value === undefined || item.value === '') {
            return false
          }
          if (item.field_type === 'checkbox' && item.value !== 'true') {
            // If checkbox is unchecked, typically we don't need to show it, or show it? Let's check requirements:
            // "badge preview di Card kanban (hanya jika nilainya ada/tidak kosong)"
            // For checkbox, value is 'true' or 'false', let's show badge only if it is checked/true.
            return false
          }
          return true
        })
        setValues(nonNull)
      } catch (err) {
        console.error('Failed to fetch custom field values for badges', err)
      }
    }
    fetchValues()
  }, [cardId])

  if (values.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {values.map((item) => {
        let displayValue = item.value
        if (item.field_type === 'checkbox') {
          displayValue = '✓'
        }
        return (
          <span
            key={item.field_id}
            className="badge badge-sm badge-info text-[9px] font-medium text-white px-1.5 py-0.5 rounded gap-1 bg-sky-500 border-none"
            title={`${item.field_name}: ${item.value}`}
          >
            <span className="opacity-80">{item.field_name}:</span>
            <span className="font-bold">{displayValue}</span>
          </span>
        )
      })}
    </div>
  )
}
