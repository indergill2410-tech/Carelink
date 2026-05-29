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

type NotificationsResponse = { notifications?: Notification[] }

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json() as Promise<NotificationsResponse>)
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
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-card-hover border border-surface-2 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-2 flex justify-between items-center">
            <p className="font-bold text-ink text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-teal hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-surface-1">
            {notifications.length === 0 ? (
              <p className="text-center text-ink/35 text-sm py-8">No notifications yet</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 transition-colors ${!n.read ? 'bg-teal/5' : 'hover:bg-surface-1'}`}
                >
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)}>
                      <p className="font-semibold text-ink text-xs">{n.title}</p>
                      <p className="text-ink/50 text-xs mt-0.5">{n.body}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="font-semibold text-ink text-xs">{n.title}</p>
                      <p className="text-ink/50 text-xs mt-0.5">{n.body}</p>
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
