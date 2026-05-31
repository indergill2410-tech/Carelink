'use client'

import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MyShiftsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-surface-2 shadow-card p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-rose-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-ink tracking-tight">Something went wrong</h1>
          <p className="text-ink/50 text-sm mt-2">
            {process.env.NODE_ENV === 'development'
              ? error.message
              : 'An unexpected error occurred loading your shifts. Please try again.'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full gap-2">
            <RotateCcw className="w-4 h-4" /> Try again
          </Button>
          <Link href="/worker/my-shifts" className="text-sm text-teal hover:underline font-medium">
            Back to My Shifts
          </Link>
        </div>
      </div>
    </div>
  )
}
