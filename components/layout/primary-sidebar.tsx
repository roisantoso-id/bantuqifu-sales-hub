'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Monitor,
  List,
  Briefcase,
  CheckCircle2,
} from 'lucide-react'
import type { NavSection } from '@/lib/types'

interface PrimarySidebarProps {
  activeNav: NavSection
  onNavChange: (nav: NavSection) => void
  userName: string
}

// 使用独立路由的模块（点击后跳转到对应路由而非 ?nav= 参数）
const ROUTE_BASED_NAV: Partial<Record<NavSection, string>> = {}

const navItems: { id: NavSection; icon: React.ReactNode; label: string; subtitle: string }[] = [
  { id: 'leads', icon: <LayoutDashboard size={18} />, label: '线索', subtitle: '线索' },
  { id: 'opportunities', icon: <Monitor size={18} />, label: '工作台', subtitle: '工作台' },
  { id: 'oppolist', icon: <List size={18} />, label: '商机列表', subtitle: '商机' },
  { id: 'customers', icon: <Users size={18} />, label: '客户', subtitle: '客户' },
  { id: 'pm_tasks', icon: <Briefcase size={18} />, label: 'PM任务指派', subtitle: 'PM指派' },
  { id: 'execution', icon: <CheckCircle2 size={18} />, label: '执行工作台', subtitle: '执行' },
  { id: 'analytics', icon: <BarChart2 size={18} />, label: '数据', subtitle: '看板' },
]

export function PrimarySidebar({ activeNav, onNavChange, userName }: PrimarySidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const initials = userName.slice(-2)

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentTenant')
    localStorage.removeItem('currentSite')
    router.push('/login')
  }

  const handleNavClick = (navId: NavSection) => {
    const route = ROUTE_BASED_NAV[navId]
    if (route) {
      // 独立路由模块：直接跳转
      router.push(route)
    } else if (pathname.startsWith('/delivery')) {
      // 从独立路由页面回到主面板
      router.push(`/?nav=${navId}`)
    } else {
      // 主面板内的 SPA 导航
      const params = new URLSearchParams()
      params.set('nav', navId)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }
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
              onClick={() => handleNavClick(item.id)}
              title={item.label}
              aria-label={item.label}
              className={[
                'flex flex-col h-12 w-12 items-center justify-center rounded-sm transition-colors gap-0.5',
                isActive
                  ? 'bg-[#eff6ff] text-[#2563eb]'
                  : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
              ].join(' ')}
            >
              {item.icon}
              <span className="text-[9px] leading-none">{item.subtitle}</span>
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
