'use client'

import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions'

export function LogoutButton() {
  return (
    <button 
      onClick={() => signOut()} 
      className="flex items-center gap-2 text-white/50 hover:text-red-400 transition-colors text-sm font-medium"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  )
}
