'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'

type Notification = {
  id: string
  title: string
  body: string
  read: boolean
  link: string | null
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'POST' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead() }}
        className="relative p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <p className="font-bold text-navy text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-teal hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-teal-50/50' : ''}`}
                >
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)}>
                      <p className="font-semibold text-navy text-xs">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{n.body}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="font-semibold text-navy text-xs">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{n.body}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
