import * as boardService from './boardService'

export async function exportBoardJSON(boardId: number, userId: number) {
  const board = await boardService.getById(boardId, userId)
  if (!board) return null
  return { board }
}

export async function exportBoardCSV(boardId: number, userId: number) {
  const board = await boardService.getById(boardId, userId)
  if (!board) return null

  const headers = ['List Title', 'Card Title', 'Description', 'Story Points', 'Due Date', 'Assignee Email', 'Created At']
  const rows = [headers.join(',')]

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  if (board.lists) {
    for (const list of board.lists) {
      if (list.cards) {
        for (const card of list.cards) {
          const row = [
            escapeCSV(list.title),
            escapeCSV(card.title),
            escapeCSV(card.description),
            escapeCSV(card.story_points),
            escapeCSV(card.due_date),
            escapeCSV(card.assignee_email),
            escapeCSV(card.created_at),
          ]
          rows.push(row.join(','))
        }
      }
    }
  }

  return rows.join('\n')
}
