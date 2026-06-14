import { db } from '../db'

export async function processRecurringTasks() {
  const now = new Date()
  const rules = await db`
    SELECT r.*, c.list_id, c.title, c.description, c.assignee_id, c.story_points, c.epic_id, c.sprint_id
    FROM recurring_tasks r
    JOIN cards c ON r.card_id = c.id
    WHERE r.is_active = TRUE AND r.next_run <= ${now}
  `

  for (const rule of rules) {
    try {
      await db.begin(async (db) => {
        // Calculate max position in that list
        const maxPos = await db`SELECT MAX(position) as max FROM cards WHERE list_id = ${rule.list_id}`
        const position = maxPos[0].max !== null ? Number(maxPos[0].max) + 1 : 0

        // Duplicate the card
        const [newCard] = await db`
          INSERT INTO cards (list_id, title, description, position, assignee_id, story_points, epic_id, sprint_id)
          VALUES (${rule.list_id}, ${rule.title}, ${rule.description}, ${position}, ${rule.assignee_id}, ${rule.story_points}, ${rule.epic_id}, ${rule.sprint_id})
          RETURNING id
        `

        // Calculate next run time
        const nextRun = calculateNextRunTime(rule.frequency)
        await db`
          UPDATE recurring_tasks
          SET next_run = ${nextRun}, updated_at = NOW()
          WHERE id = ${rule.id}
        `
      })
    } catch (err) {
      console.error(`Failed to process recurring task rule ${rule.id}:`, err)
    }
  }
}

function calculateNextRunTime(frequency: string): Date {
  const date = new Date()
  if (frequency === 'daily') {
    date.setDate(date.getDate() + 1)
  } else if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7)
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  }
  return date
}
