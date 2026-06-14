import type { PresenceUser } from '../../lib/types'

interface PresenceIndicatorProps {
  users: PresenceUser[]
  maxDisplay?: number
}

export function PresenceIndicator({ users, maxDisplay = 5 }: PresenceIndicatorProps) {
  if (users.length === 0) return null

  const displayUsers = users.slice(0, maxDisplay)
  const remaining = users.length - maxDisplay

  return (
    <div className="flex items-center">
      <div className="avatar-group -space-x-4 rtl:space-x-reverse">
        {displayUsers.map((user) => (
          <div
            key={user.id}
            className="avatar placeholder relative group cursor-pointer"
            title={user.name}
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary ring-2 ring-base-100 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] uppercase font-extrabold">
                  {user.name.slice(0, 2)}
                </span>
              )}
            </div>
            {/* Green dot online indicator */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-success ring-2 ring-base-100 z-10 animate-pulse" />

            {/* Custom Tooltip */}
            <div className="absolute bottom-full mb-1.5 hidden group-hover:block bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50 left-1/2 -translate-x-1/2 font-semibold">
              {user.name}
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <div className="avatar placeholder">
            <div className="w-7 h-7 rounded-full bg-base-300 text-base-content font-extrabold text-[9px] ring-2 ring-base-100 flex items-center justify-center">
              <span>+{remaining}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
