'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, ListTodo, ClipboardList, Wallet } from 'lucide-react'

const deliveryNavItems = [
  { href: '/delivery', icon: <FolderKanban size={16} />, label: '交付看板', exact: true },
  { href: '/delivery/projects', icon: <ListTodo size={16} />, label: '项目大厅', exact: false },
  { href: '/delivery/tasks', icon: <ClipboardList size={16} />, label: '我的工作台', exact: false },
  { href: '/delivery/commissions', icon: <Wallet size={16} />, label: '提成账单', exact: false },
]

export function DeliverySubNav() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-[180px] flex-col border-r border-[#e5e7eb] bg-[#f9fafb]">
      <div className="border-b border-[#e5e7eb] bg-white px-3 py-3">
        <span className="text-[13px] font-semibold text-[#111827]">交付中心</span>
      </div>

      <nav className="flex flex-col gap-0.5 p-2">
        {deliveryNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors',
                isActive
                  ? 'bg-[#eff6ff] text-[#2563eb] font-medium'
                  : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
