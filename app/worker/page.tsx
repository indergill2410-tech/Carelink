import { MapPin, Clock, Calendar, CheckCircle2, ChevronRight, Activity } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { LogoutButton } from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'

export default function WorkerApp() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans pb-24">
      <header className="px-6 pt-12 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-white/50 mb-1">Good evening,</p>
            <h1 className="text-2xl font-medium tracking-tight">Worker Demo</h1>
          </div>
          <LogoutButton />
        </div>
        <div className="bg-white/5 border border-white/10 p-1 rounded-full flex relative">
          <div className="w-1/2 text-center py-2 text-sm font-medium bg-[#1A1A1A] rounded-full shadow-sm shadow-black border border-white/5 text-amber-500">Available</div>
          <div className="w-1/2 text-center py-2 text-sm font-medium text-white/40 hover:text-white/70 cursor-pointer">Do Not Disturb</div>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-8">
        <ShiftFeed />
      </main>

      <nav className="fixed bottom-0 w-full bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-6 flex justify-between items-center h-20">
        <div className="flex flex-col items-center gap-1 text-amber-500">
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">SHIFTS</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">SCHEDULE</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">COMPLETED</span>
        </div>
      </nav>
    </div>
  )
}

async function ShiftFeed() {
  const availableShifts = await prisma.shift.findMany({
    where: {
      status: 'PENDING',
      startTime: { gt: new Date() }
    },
    include: { facility: true },
    orderBy: { startTime: 'asc' }
  })

  if (availableShifts.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl text-center">
        <p className="text-white/50">No shifts available right now.</p>
      </div>
    )
  }

  const formatTime = (date: Date) => date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
  const formatDate = (date: Date) => date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium tracking-widest uppercase text-white/40">Available Near You</h2>
        <span className="text-xs text-amber-500 cursor-pointer">Filter</span>
      </div>

      <div className="space-y-3">
        {availableShifts.map((shift) => (
          <div key={shift.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex justify-between mb-3">
              <h3 className="font-medium text-white/90">General Ward ({shift.role})</h3>
              <span className="text-emerald-400 text-sm font-medium">${shift.hourlyRate.toFixed(2)}/hr</span>
            </div>
            <div className="space-y-2 mb-5 text-sm text-white/50">
              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formatDate(shift.startTime)}</div>
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {formatTime(shift.startTime)} - {formatTime(shift.endTime)}</div>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {shift.facility?.name || 'Unknown Facility'}</div>
            </div>
            <button className="w-full py-3 bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 text-white rounded-xl text-sm font-medium transition-colors border border-white/5 flex items-center justify-center gap-2">
              Accept Shift <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
