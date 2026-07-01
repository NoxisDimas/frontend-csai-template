import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ChartPoint } from '../../types'

export default function AreaChartCard({ title, data, color }: { title: string; data: ChartPoint[]; color: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-400">Realtime</span>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                <stop offset="95%" stopColor={color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(148, 163, 184, 0.2)' }} itemStyle={{ color: '#fff' }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill="url(#chartGradient)" activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
