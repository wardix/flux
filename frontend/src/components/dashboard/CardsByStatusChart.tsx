import type { StatusCount } from '../../lib/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Props {
  data: StatusCount[]
  isLoading: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658']

export function CardsByStatusChart({ data, isLoading }: Props) {
  if (isLoading) {
    return <div className="h-64 flex items-center justify-center bg-base-100 rounded-box animate-pulse">Loading...</div>
  }

  return (
    <div className="bg-base-100 p-4 rounded-box shadow flex flex-col h-80">
      <h3 className="font-semibold text-lg mb-2">Cards by Status</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="count"
              nameKey="status"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'oklch(var(--b1))', borderColor: 'oklch(var(--b3))' }}
              itemStyle={{ color: 'oklch(var(--bc))' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
