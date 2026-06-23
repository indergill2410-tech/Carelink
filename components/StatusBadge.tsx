import { cn } from '@/lib/utils'

type Status = 'PENDING' | 'MATCHED' | 'CLOCKED_IN' | 'COMPLETED' | 'CANCELLED' | 'DRAFT'

const CONFIG: Record<Status, { dot: string; badge: string; label: string }> = {
  PENDING:    { dot: 'bg-amber-400 animate-pulse',    badge: 'bg-amber-50  text-amber-800  border-amber-200',    label: 'Awaiting Staff'  },
  MATCHED:    { dot: 'bg-emerald-500',                badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Confirmed'       },
  CLOCKED_IN: { dot: 'bg-blue-500 animate-pulse',     badge: 'bg-blue-50  text-blue-700  border-blue-200',       label: 'On Shift'        },
  COMPLETED:  { dot: 'bg-emerald-500',                badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed'       },
  CANCELLED:  { dot: 'bg-stone-400',                  badge: 'bg-stone-50 text-stone-500  border-stone-200',     label: 'Cancelled'       },
  DRAFT:      { dot: 'bg-stone-300',                  badge: 'bg-stone-50 text-stone-500  border-stone-200',     label: 'Draft'           },
}

export function StatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: string
  className?: string
  showDot?: boolean
}) {
  const cfg = CONFIG[status as Status] ?? CONFIG.CANCELLED
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-[11px] font-bold uppercase tracking-wide border',
        'transition-all duration-200',
        cfg.badge,
        className,
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />}
      {cfg.label}
    </span>
  )
}

export function ComplianceBadge({ status }: { status: string | null }) {
  const isGreen = status === 'GREEN'
  const isAmber = status === 'AMBER'
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border',
      isGreen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
      isAmber ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-rose-50 text-rose-700 border-rose-200',
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full shrink-0',
        isGreen ? 'bg-emerald-500' : isAmber ? 'bg-amber-400 animate-pulse' : 'bg-rose-500 animate-pulse',
      )} />
      {isGreen ? 'Verified' : isAmber ? 'In Review' : 'Incomplete'}
    </span>
  )
}
