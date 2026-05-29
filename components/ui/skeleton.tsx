import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-lg", className)}
      {...props}
    />
  )
}

export function ShiftCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-3 shadow-card overflow-hidden">
      <div className="h-1.5 skeleton" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full rounded-xl mt-4" />
      </div>
    </div>
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-surface-3 shadow-card p-5">
      <Skeleton className="h-3.5 w-24 mb-3" />
      <Skeleton className="h-9 w-16 mb-2" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}
