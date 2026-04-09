import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PM任务指派 - 销售中心',
  description: '监控P2-P5商机，管理交付激活流程',
}

export default function PMTasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
