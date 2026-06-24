'use client'

import { Download } from 'lucide-react'

export type EarningsRow = {
  date: string
  facility: string
  role: string
  hours: number
  gross: number
}

export function EarningsCsvButton({ rows }: { rows: EarningsRow[] }) {
  function exportCsv() {
    const header = ['Date', 'Facility', 'Role', 'Hours', 'Gross (AUD)']
    const lines = rows.map(r => [
      r.date,
      `"${r.facility.replace(/"/g, '""')}"`,
      r.role,
      r.hours.toFixed(2),
      r.gross.toFixed(2),
    ].join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carelink-earnings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={exportCsv}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-surface-3 bg-white text-xs font-bold text-ink/60 hover:text-ink hover:border-teal/40 transition-colors disabled:opacity-40"
    >
      <Download className="w-3.5 h-3.5" /> Export CSV
    </button>
  )
}
