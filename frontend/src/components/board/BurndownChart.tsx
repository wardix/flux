import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface BurndownChartProps {
  boardId: number
  sprintId: number
}

export function BurndownChart({ boardId, sprintId }: BurndownChartProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBurndown = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<{ data: any }>(`/boards/${boardId}/sprints/${sprintId}/burndown`)
        setData(res.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load burndown data')
      } finally {
        setLoading(false)
      }
    }
    fetchBurndown()
  }, [boardId, sprintId])

  if (loading) return <div className="text-xs text-base-content/50">Loading burndown data...</div>
  if (error) return <div className="alert alert-error text-xs p-2 rounded"><span>{error}</span></div>
  if (!data) return null

  // Format data for Recharts by joining ideal_line and actual_line based on day/date
  const chartData = data.ideal_line.map((idealPoint: any) => {
    const actualPoint = data.actual_line.find((a: any) => a.day === idealPoint.day)
    return {
      day: `Day ${idealPoint.day}`,
      date: idealPoint.date,
      'Ideal Burn': idealPoint.value,
      'Actual Remaining': actualPoint ? actualPoint.value : null,
    }
  })

  return (
    <div className="bg-base-100 p-4 border border-base-200 shadow-sm rounded-xl space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">
          Sprint Burndown Chart
        </span>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" />
            <XAxis dataKey="day" stroke="currentColor" className="text-[10px] text-base-content/50" />
            <YAxis stroke="currentColor" className="text-[10px] text-base-content/50" label={{ value: 'Story Points', angle: -90, position: 'insideLeft', style: { fill: 'currentColor', opacity: 0.5 } }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--fallback-b2, hsl(var(--b2)))', borderColor: 'var(--fallback-b3, hsl(var(--b3)))', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line
              type="monotone"
              dataKey="Ideal Burn"
              stroke="#6366f1"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Actual Remaining"
              stroke="#ef4444"
              strokeWidth={2.5}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
