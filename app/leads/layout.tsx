import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '线索管理 - BantuQIFU Sales Hub',
  description: '管理销售线索',
}

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {children}
    </div>
  )
}
