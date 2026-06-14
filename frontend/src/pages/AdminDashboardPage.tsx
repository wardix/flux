import { useEffect, useState } from 'react'
import { UserManagement } from '../components/admin/UserManagement'
import { api } from '../lib/api'

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
}

interface AdminDashboardPageProps {
  onBack: () => void
}

export function AdminDashboardPage({ onBack }: AdminDashboardPageProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await api.get<{ data: User[]; meta: Meta }>('/admin/users?per_page=100')
      const allUsers = res.data
      const total = res.meta.total

      const suspended = allUsers.filter((u) => u.is_suspended).length
      const admins = allUsers.filter((u) => u.is_super_admin).length
      const active = total - suspended

      setStats({
        totalUsers: total,
        activeUsers: active,
        suspendedUsers: suspended,
        adminUsers: admins,
      })
    } catch (err) {
      console.error('Failed to calculate stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-xs text-base-content/50 mt-1">
            Manage application users, monitor status, and configure configurations.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline btn-sm gap-2 rounded-full border-base-300 text-xs hover:bg-base-200"
        >
          <span>🏠</span> Back to Board
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200/50 p-4 shadow-sm space-y-1">
          <span className="text-xs text-base-content/50 font-bold uppercase tracking-wider">
            Total Users
          </span>
          {isLoading ? (
            <span className="loading loading-dots loading-sm text-primary"></span>
          ) : (
            <h3 className="text-2xl font-bold text-base-content">{stats.totalUsers}</h3>
          )}
        </div>

        <div className="card bg-base-100 border border-base-200/50 p-4 shadow-sm space-y-1">
          <span className="text-xs text-base-content/50 font-bold uppercase tracking-wider">
            Active Users
          </span>
          {isLoading ? (
            <span className="loading loading-dots loading-sm text-success"></span>
          ) : (
            <h3 className="text-2xl font-bold text-success">{stats.activeUsers}</h3>
          )}
        </div>

        <div className="card bg-base-100 border border-base-200/50 p-4 shadow-sm space-y-1">
          <span className="text-xs text-base-content/50 font-bold uppercase tracking-wider">
            Suspended
          </span>
          {isLoading ? (
            <span className="loading loading-dots loading-sm text-error"></span>
          ) : (
            <h3 className="text-2xl font-bold text-error">{stats.suspendedUsers}</h3>
          )}
        </div>

        <div className="card bg-base-100 border border-base-200/50 p-4 shadow-sm space-y-1">
          <span className="text-xs text-base-content/50 font-bold uppercase tracking-wider">
            Admins
          </span>
          {isLoading ? (
            <span className="loading loading-dots loading-sm text-primary"></span>
          ) : (
            <h3 className="text-2xl font-bold text-primary">{stats.adminUsers}</h3>
          )}
        </div>
      </div>

      {/* User Management Section */}
      <div className="space-y-4">
        <div className="border-b border-base-200 pb-2">
          <h2 className="text-lg font-bold text-base-content/85">User Management</h2>
          <p className="text-xs text-base-content/50">
            Search, paginate, suspend users, or promote users to Super Admin.
          </p>
        </div>

        {/* Render the UserManagement table */}
        <UserManagement />
      </div>
    </div>
  )
}
