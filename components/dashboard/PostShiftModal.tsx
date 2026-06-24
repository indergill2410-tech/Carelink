'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { broadcastShift } from '@/app/dashboard/_actions'

type FacilityOption = { id: string; name: string }

export function PostShiftModal({ facilities }: { facilities: FacilityOption[] }) {
  const params = useSearchParams()
  // Auto-open (with the server-side validation error) after a failed submit
  // redirected back here with ?post=1.
  const [open, setOpen] = useState(() => params.get('post') === '1')

  const error = params.get('error')

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 shadow-btn">
        <Zap className="w-4 h-4" /> Post a Shift
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-0 rounded-3xl shadow-modal w-full max-w-md relative animate-scale-in">
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-surface-2">
              <div>
                <h3 className="text-xl font-black tracking-tight text-ink">Post a Shift</h3>
                <p className="text-sm text-ink/45 mt-0.5">We&apos;ll match you with a verified carer</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors">
                <X className="w-4 h-4 text-ink/50" />
              </button>
            </div>

            <form action={broadcastShift} className="p-7 space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{decodeURIComponent(error)}</div>
              )}

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Care Home</label>
                <select name="facilityId" className="w-full h-11 rounded-xl border border-surface-3 bg-surface-0 px-4 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required>
                  <option value="">Select a care home…</option>
                  {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Role Required</label>
                <select name="role" className="w-full h-11 rounded-xl border border-surface-3 bg-surface-0 px-4 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required>
                  <option value="NURSE">Registered Nurse (RN)</option>
                  <option value="EN">Enrolled Nurse (EN)</option>
                  <option value="PCA">Personal Care Assistant</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['startTime', 'endTime'] as const).map((name, i) => (
                  <div key={name} className="space-y-1.5">
                    <label className="text-label text-ink/50">{i === 0 ? 'Start' : 'End'}</label>
                    <input type="datetime-local" name={name} className="w-full h-11 rounded-xl border border-surface-3 bg-surface-0 px-3 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Hourly Rate</label>
                <input type="number" name="hourlyRate" step="0.01" min="0" className="w-full h-11 rounded-xl border border-surface-3 bg-surface-0 px-4 text-sm text-ink focus:outline-none focus:border-teal focus:shadow-focus transition-all" required placeholder="Enter rate…" />
                <p className="text-[11px] text-ink/35">Award wages apply — rate is for internal costing only.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-label text-ink/50">Notes (optional)</label>
                <textarea name="notes" rows={2} maxLength={500} className="w-full rounded-xl border border-surface-3 bg-surface-0 px-4 py-3 text-sm text-ink resize-none focus:outline-none focus:border-teal focus:shadow-focus transition-all" placeholder="Any special requirements for this shift…" />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input type="checkbox" name="urgent" className="w-4 h-4 rounded accent-rose-500" />
                <span className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Mark as Urgent
                </span>
              </label>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 gap-2">Post Shift</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
