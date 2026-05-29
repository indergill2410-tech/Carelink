import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  MATCHED: 'border-blue-200 bg-blue-50 text-blue-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-500',
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
  GREEN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  AMBER: 'border-amber-200 bg-amber-50 text-amber-700',
  RED: 'border-rose-200 bg-rose-50 text-rose-700',
}

const dotStyles: Record<string, string> = {
  PENDING: 'bg-amber-500',
  MATCHED: 'bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.55)]',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-400',
  DRAFT: 'bg-slate-400',
  GREEN: 'bg-emerald-500',
  AMBER: 'bg-amber-500',
  RED: 'bg-rose-500',
}

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const value = status ?? 'UNKNOWN'
  const animated = value === 'PENDING' || value === 'MATCHED' || value === 'AMBER'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]',
        statusStyles[value] ?? 'border-slate-200 bg-slate-50 text-slate-600',
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', dotStyles[value] ?? 'bg-slate-400')}
        style={animated ? { animation: 'badge-pulse 1.8s ease-in-out infinite' } : undefined}
      />
      {value}
    </span>
  )
}
