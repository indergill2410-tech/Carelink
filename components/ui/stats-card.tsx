import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function StatsCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'blue'
}) {
  const tones = {
    default: 'from-slate-900 to-slate-700 text-white',
    success: 'from-emerald-500 to-teal-600 text-white',
    warning: 'from-amber-400 to-orange-500 text-white',
    danger: 'from-rose-500 to-red-600 text-white',
    blue: 'from-blue-500 to-indigo-600 text-white',
  }

  return (
    <div className="premium-card overflow-hidden rounded-2xl border border-white/70 bg-white shadow-card">
      <div className={cn('h-1.5 bg-gradient-to-r', tones[tone])} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <div className="number-tabular mt-2 text-3xl font-black tracking-tight text-ink">{value}</div>
          </div>
          {icon && <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">{icon}</div>}
        </div>
        {hint && <p className="mt-3 text-xs font-medium text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}
