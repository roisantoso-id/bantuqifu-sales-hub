'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, CheckSquare } from 'lucide-react'

interface Props {
  roleCode: string
}

export default function DeliverySidebar({ roleCode }: Props) {
  const pathname = usePathname()

  const isPM = roleCode === 'DELIVERY_PM' || roleCode === 'ADMIN'

  const navItems = [
    ...(isPM ? [{
      href: '/delivery/dispatch',
      label: '派单中心',
      icon: ClipboardList,
    }] : []),
    {
      href: '/delivery/tasks',
      label: '我的任务',
      icon: CheckSquare,
    },
  ]

  return (
    <aside className="flex w-56 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold text-gray-900">交付履约工作站</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
