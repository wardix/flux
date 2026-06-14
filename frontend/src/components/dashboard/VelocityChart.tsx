import type { VelocityData } from '../../lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  data: VelocityData[]
  isLoading: boolean
}

export function VelocityChart({ data, isLoading }: Props) {
  if (isLoading) {
    return <div className="h-64 flex items-center justify-center bg-base-100 rounded-box animate-pulse">Loading...</div>
  }

  return (
    <div className="bg-base-100 p-4 rounded-box shadow flex flex-col h-80">
      <h3 className="font-semibold text-lg mb-2">Velocity (Added vs Completed)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--b3))" />
            <XAxis dataKey="period" angle={-45} textAnchor="end" height={60} stroke="oklch(var(--bc))" />
            <YAxis stroke="oklch(var(--bc))" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'oklch(var(--b1))', borderColor: 'oklch(var(--b3))' }}
              itemStyle={{ color: 'oklch(var(--bc))' }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="added" name="Cards Added" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Cards Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
