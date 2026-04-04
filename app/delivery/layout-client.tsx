'use client'

import { PrimarySidebar } from '@/components/layout/primary-sidebar'
import { DeliverySubNav } from '@/components/delivery/delivery-sub-nav'

interface DeliveryLayoutClientProps {
  userName: string
  children: React.ReactNode
}

export function DeliveryLayoutClient({ userName, children }: DeliveryLayoutClientProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* 主导航栏 (56px) */}
      <PrimarySidebar
        activeNav="delivery"
        onNavChange={() => {}}
        userName={userName}
      />

      {/* 交付子导航 (180px) */}
      <DeliverySubNav />

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto bg-[#f9fafb]">
        {children}
      </main>
    </div>
  )
}
