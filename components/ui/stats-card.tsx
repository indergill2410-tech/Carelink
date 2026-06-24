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
    default: 'from-ink to-[#2a2522] text-white',
    success: 'from-emerald-500 to-emerald-600 text-white',
    warning: 'from-amber-400 to-amber-600 text-white',
    danger: 'from-rose-500 to-red-600 text-white',
    blue: 'from-sage-500 to-sage-700 text-white',
  }

  return (
    <div className="premium-card overflow-hidden rounded-2xl border border-white/70 bg-white shadow-card">
      <div className={cn('h-1.5 bg-gradient-to-r', tones[tone])} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</p>
            <div className="number-tabular mt-2 text-3xl font-black tracking-tight text-ink">{value}</div>
          </div>
          {icon && <div className="rounded-2xl bg-surface-2 p-3 text-ink/55">{icon}</div>}
        </div>
        {hint && <p className="mt-3 text-xs font-medium text-ink/45">{hint}</p>}
      </div>
    </div>
  )
}
