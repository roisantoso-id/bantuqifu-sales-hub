'use client'

import { MessageCircle, ChevronDown } from 'lucide-react'
import type { UserProfile } from '@/lib/types'

interface UserProfileBarProps {
  user: UserProfile
}

export function UserProfileBar({ user }: UserProfileBarProps) {
  const initials = user.name.slice(0, 1)

  return (
    <button className="flex items-center gap-2 rounded-sm px-2 py-1 transition-colors hover:bg-[#f3f4f6]">
      {/* Avatar */}
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-medium text-white">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full" />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="text-left">
        <div className="flex items-center gap-1">
          <span className="text-[12px] font-medium text-[#111827]">{user.name}</span>
          <MessageCircle className="h-3 w-3 text-[#22c55e]" />
        </div>
        <div className="text-[10px] text-[#6b7280]">{user.company}</div>
      </div>

      <ChevronDown className="h-3 w-3 text-[#6b7280]" />
    </button>
  )
}
