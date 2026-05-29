import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center', className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
