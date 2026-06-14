import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface User {
  id: number
  email: string
  avatar_url: string | null
  is_super_admin: boolean
  is_suspended: boolean
  created_at: string
}

interface Meta {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `/admin/users?page=${page}&per_page=${perPage}${
        search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''
      }`
      const res = await api.get<{ data: User[]; meta: Meta }>(url)
      setUsers(res.data)
      setMeta(res.meta)
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setError('Failed to fetch users list. Make sure you are logged in as a Super Admin.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const handleToggleSuspend = async (userId: number, currentStatus: boolean) => {
    try {
      const updatedUser = await api.put<{ data: User }>(`/admin/users/${userId}`, {
        is_suspended: !currentStatus,
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_suspended: updatedUser.data.is_suspended } : u,
        ),
      )
    } catch (err) {
      console.error('Failed to update suspension status:', err)
      alert('Failed to update suspension status')
    }
  }

  const handleToggleSuperAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      const updatedUser = await api.put<{ data: User }>(`/admin/users/${userId}`, {
        is_super_admin: !currentStatus,
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_super_admin: updatedUser.data.is_super_admin } : u,
        ),
      )
    } catch (err) {
      console.error('Failed to update super admin status:', err)
      alert('Failed to update admin status')
    }
  }

  const getInitials = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : '?'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-base-100 p-4 border border-base-200/50 rounded-xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search users by email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // reset page on search
            }}
            className="input input-bordered input-sm w-full focus:outline-none focus:input-primary text-xs pl-8"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-base-content/40">🔍</span>
        </div>

        {meta && (
          <span className="text-xs text-base-content/65 font-medium">
            Total Users: <strong>{meta.total}</strong>
          </span>
        )}
      </div>

      {error && (
        <div className="alert alert-error text-sm rounded-xl py-3 shadow-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto bg-base-100 border border-base-200/50 rounded-xl shadow-sm">
        <table className="table table-xs md:table-sm w-full">
          <thead>
            <tr className="bg-base-200/50 text-base-content/70">
              <th>User</th>
              <th>Status</th>
              <th>Role</th>
              <th>Joined Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <p className="text-xs text-base-content/50 mt-2">Loading users...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs text-base-content/50 italic">
                  No users found matching the search criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-base-50/50 transition-colors">
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.email}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {getInitials(user.email)}
                        </div>
                      )}
                      <span className="truncate max-w-[180px] md:max-w-xs">{user.email}</span>
                    </div>
                  </td>
                  <td>
                    {user.is_suspended ? (
                      <span className="badge badge-sm badge-error font-medium py-1">Suspended</span>
                    ) : (
                      <span className="badge badge-sm badge-success font-medium py-1">Active</span>
                    )}
                  </td>
                  <td>
                    {user.is_super_admin ? (
                      <span className="badge badge-sm badge-primary font-medium py-1">
                        Super Admin
                      </span>
                    ) : (
                      <span className="badge badge-sm badge-ghost font-medium py-1">User</span>
                    )}
                  </td>
                  <td className="text-base-content/60 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSuspend(user.id, user.is_suspended)}
                      className={`btn btn-xs ${
                        user.is_suspended ? 'btn-success btn-outline' : 'btn-error btn-outline'
                      }`}
                    >
                      {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSuperAdmin(user.id, user.is_super_admin)}
                      className={`btn btn-xs ${
                        user.is_super_admin ? 'btn-ghost btn-outline' : 'btn-primary'
                      }`}
                    >
                      {user.is_super_admin ? 'Demote' : 'Promote'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="btn btn-sm btn-outline"
          >
            ◀ Prev
          </button>
          <span className="text-xs font-semibold text-base-content/75">
            Page {page} of {meta.total_pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
            disabled={page === meta.total_pages || isLoading}
            className="btn btn-sm btn-outline"
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  )
}
