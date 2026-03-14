'use client'

import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  BarChart2,
  Settings,
  LogOut,
} from 'lucide-react'
import type { NavSection } from '@/lib/types'

interface PrimarySidebarProps {
  activeNav: NavSection
  onNavChange: (nav: NavSection) => void
  userName: string
}

const navItems: { id: NavSection; icon: React.ReactNode; label: string }[] = [
  { id: 'leads', icon: <LayoutDashboard size={18} />, label: '线索' },
  { id: 'opportunities', icon: <TrendingUp size={18} />, label: '商机' },
  { id: 'customers', icon: <Users size={18} />, label: '客户' },
  { id: 'analytics', icon: <BarChart2 size={18} />, label: '数据' },
]

export function PrimarySidebar({ activeNav, onNavChange, userName }: PrimarySidebarProps) {
  const router = useRouter()
  const initials = userName.slice(-2)

  const handleLogout = () => {
    // 清除本地认证状态
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentTenant')
    localStorage.removeItem('currentSite')
    // 重定向到登录页
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-14 flex-col items-center border-r border-[#e5e7eb] bg-white py-2">
      {/* Logo mark */}
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-sm bg-[#2563eb]">
        <span className="text-[11px] font-bold text-white">B</span>
      </div>

      {/* Divider */}
      <div className="mb-2 h-px w-8 bg-[#e5e7eb]" />

      {/* Nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-0.5">
        {navItems.map((item) => {
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              title={item.label}
              aria-label={item.label}
              className={[
                'flex h-9 w-9 items-center justify-center rounded-sm transition-colors',
                isActive
                  ? 'bg-[#eff6ff] text-[#2563eb]'
                  : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
              ].join(' ')}
            >
              {item.icon}
            </button>
          )
        })}
      </nav>

      {/* Bottom: settings + logout + avatar */}
      <div className="flex flex-col items-center gap-1">
        <button
          title="设置"
          aria-label="设置"
          className="flex h-9 w-9 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={handleLogout}
          title="退出系统"
          aria-label="退出系统"
          className="flex h-9 w-9 items-center justify-center rounded-sm text-[#6b7280] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors"
        >
          <LogOut size={16} />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-semibold text-white">
          {initials}
        </div>
      </div>
    </aside>
  )
}
