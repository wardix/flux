import { BoardColumn } from './BoardColumn'
import type { List, Sprint } from '../../lib/types'

interface SprintBoardProps {
  sprint: Sprint
  lists: List[]
}

export function SprintBoard({ sprint, lists }: SprintBoardProps) {
  // Filter cards in columns by the active sprint_id
  const filteredLists = lists.map((list) => {
    const cards = (list.cards || []).filter((card) => card.sprint_id === sprint.id)
    return {
      ...list,
      cards,
    }
  })

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50/30 dark:bg-indigo-950/10 p-4 border border-indigo-200/40 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-wider">
            Active Sprint Kanban: {sprint.title}
          </h3>
          {sprint.goal && (
            <p className="text-xs text-base-content/65 mt-0.5 font-medium">
              Goal: {sprint.goal}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-base-content/50">
          <span>Start: {new Date(sprint.start_date).toLocaleDateString()}</span>
          <span>•</span>
          <span>End: {new Date(sprint.end_date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-1 min-h-[60vh] items-start">
          {filteredLists.map((column) => (
            <BoardColumn key={column.id} list={column} />
          ))}
        </div>
      </div>
    </div>
  )
}
