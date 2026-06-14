import { db } from '../db'

export async function getFieldsByBoard(boardId: number) {
  const fields = await db`
    SELECT * FROM custom_fields
    WHERE board_id = ${boardId}
    ORDER BY position ASC, id ASC
  `
  return fields.map((field) => {
    if (field.options && typeof field.options === 'string') {
      try {
        field.options = JSON.parse(field.options)
      } catch {}
    }
    return field
  })
}

export async function createField(boardId: number, data: { name: string; field_type: string; options?: any; is_required?: boolean; position?: number }) {
  const existing = await db`
    SELECT id FROM custom_fields
    WHERE board_id = ${boardId} AND name = ${data.name}
  `
  if (existing.length > 0) {
    const error = new Error('Field name already exists on this board')
    ;(error as any).status = 409
    throw error
  }

  if (data.field_type === 'dropdown') {
    if (!data.options || !data.options.choices || !Array.isArray(data.options.choices) || data.options.choices.length === 0) {
      const error = new Error('Dropdown field requires options with choices')
      ;(error as any).status = 400
      throw error
    }
  }

  const isRequired = data.is_required ?? false
  const position = data.position ?? 0
  const options = data.options ? JSON.stringify(data.options) : null

  const [field] = await db`
    INSERT INTO custom_fields (board_id, name, field_type, options, is_required, position)
    VALUES (${boardId}, ${data.name}, ${data.field_type}, ${options}, ${isRequired}, ${position})
    RETURNING *
  `
  if (field && field.options && typeof field.options === 'string') {
    try {
      field.options = JSON.parse(field.options)
    } catch {}
  }
  return field
}

export async function updateField(fieldId: number, data: { name?: string; options?: any; is_required?: boolean; position?: number }) {
  const [existing] = await db`SELECT * FROM custom_fields WHERE id = ${fieldId}`
  if (!existing) return null

  if (data.name) {
    const duplicate = await db`
      SELECT id FROM custom_fields
      WHERE board_id = ${existing.board_id} AND name = ${data.name} AND id != ${fieldId}
    `
    if (duplicate.length > 0) {
      const error = new Error('Field name already exists on this board')
      ;(error as any).status = 409
      throw error
    }
  }

  const updates: Record<string, any> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.options !== undefined) updates.options = data.options ? JSON.stringify(data.options) : null
  if (data.is_required !== undefined) updates.is_required = data.is_required
  if (data.position !== undefined) updates.position = data.position

  if (Object.keys(updates).length === 0) return existing

  const [field] = await db`
    UPDATE custom_fields
    SET ${db(updates)}, updated_at = NOW()
    WHERE id = ${fieldId}
    RETURNING *
  `
  return field
}

export async function deleteField(fieldId: number) {
  const res = await db`
    DELETE FROM custom_fields WHERE id = ${fieldId}
    RETURNING id
  `
  return res.length > 0
}

export async function getCardValues(cardId: number) {
  return await db`
    SELECT 
      v.field_id,
      f.name as field_name,
      f.field_type,
      f.options,
      v.value
    FROM card_custom_field_values v
    JOIN custom_fields f ON v.field_id = f.id
    WHERE v.card_id = ${cardId}
    ORDER BY f.position ASC, f.id ASC
  `
}

export async function setCardValues(cardId: number, values: { field_id: number; value: string | null }[]) {
  for (const item of values) {
    const [field] = await db`SELECT * FROM custom_fields WHERE id = ${item.field_id}`
    if (!field) {
      const error = new Error(`Custom field with id ${item.field_id} not found`)
      ;(error as any).status = 404
      throw error
    }

    if (item.value !== null && item.value !== '') {
      if (field.field_type === 'number') {
        const num = Number(item.value)
        if (Number.isNaN(num)) {
          const error = new Error(`Value for field "${field.name}" must be a number`)
          ;(error as any).status = 400
          throw error
        }
      } else if (field.field_type === 'dropdown') {
        let options = field.options
        if (options && typeof options === 'string') {
          try {
            options = JSON.parse(options)
          } catch {}
        }
        const choices = options?.choices || []
        const exists = choices.some((c: any) => c.value === item.value)
        if (!exists) {
          const error = new Error(`Value "${item.value}" is not a valid choice for field "${field.name}"`)
          ;(error as any).status = 400
          throw error
        }
      } else if (field.field_type === 'date') {
        const time = Date.parse(item.value)
        if (Number.isNaN(time)) {
          const error = new Error(`Value for field "${field.name}" must be a valid date`)
          ;(error as any).status = 400
          throw error
        }
      } else if (field.field_type === 'checkbox') {
        if (item.value !== 'true' && item.value !== 'false') {
          const error = new Error(`Value for field "${field.name}" must be true or false`)
          ;(error as any).status = 400
          throw error
        }
      }
    }
  }

  await db.begin(async (db) => {
    for (const item of values) {
      if (item.value === null || item.value === '') {
        await db`
          DELETE FROM card_custom_field_values
          WHERE card_id = ${cardId} AND field_id = ${item.field_id}
        `
      } else {
        await db`
          INSERT INTO card_custom_field_values (card_id, field_id, value)
          VALUES (${cardId}, ${item.field_id}, ${item.value})
          ON CONFLICT (card_id, field_id)
          DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `
      }
    }
  })

  return true
}
