'use client'

import { useState, useMemo } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import type { ChinaEntity } from '@/lib/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Mock data - 天眼查企业数据示例
const MOCK_ENTITIES: ChinaEntity[] = [
  {
    id: '91110105MAEJRT8908',
    companyName: '北京斑兔企业服务有限公司',
    creditCode: '91110105MAEJRT8908',
    legalPerson: '张三',
    regCapital: '1000万人民币',
    businessScope: '企业管理咨询；进出口代理',
    status: '存续',
    industry: '商业服务业',
    foundedDate: '2020-06-15',
    registrationLocation: '北京市朝阳区',
  },
  {
    id: '91110105MAEJRT8909',
    companyName: '北京云图科技有限公司',
    creditCode: '91110105MAEJRT8909',
    legalPerson: '李四',
    regCapital: '5000万人民币',
    businessScope: '软件开发；技术咨询',
    status: '存续',
    industry: '信息传输、软件和信息技术服务业',
    foundedDate: '2018-03-22',
    registrationLocation: '北京市海淀区',
  },
  {
    id: '91110105MAEJRT8910',
    companyName: '北京制造业集团有限公司',
    creditCode: '91110105MAEJRT8910',
    legalPerson: '王五',
    regCapital: '10000万人民币',
    businessScope: '机械设备制造；国际贸易',
    status: '存续',
    industry: '制造业',
    foundedDate: '2015-01-10',
    registrationLocation: '北京市通州区',
  },
  {
    id: '91110105MAEJRT8911',
    companyName: '北京异常企业有限公司',
    creditCode: '91110105MAEJRT8911',
    legalPerson: '孙六',
    regCapital: '500万人民币',
    businessScope: '贸易代理',
    status: '吊销',
    industry: '商业服务业',
    foundedDate: '2019-05-20',
    registrationLocation: '北京市东城区',
  },
]

interface ChinaEntitySearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (entity: ChinaEntity) => void
}

export function ChinaEntitySearchDialog({ open, onOpenChange, onSelect }: ChinaEntitySearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<ChinaEntity | null>(null)

  const results = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_ENTITIES
    const q = searchQuery.toLowerCase()
    return MOCK_ENTITIES.filter(
      (e) => e.companyName.toLowerCase().includes(q) || 
              e.creditCode.includes(q) || 
              e.legalPerson.includes(q)
    )
  }, [searchQuery])

  const handleConfirm = () => {
    if (selectedEntity) {
      onSelect(selectedEntity)
      setSearchQuery('')
      setSelectedEntity(null)
      onOpenChange(false)
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? `<mark class="bg-yellow-200">${part}</mark>` : part
    ).join('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '存续':
        return 'bg-green-50 text-green-700 border border-green-200'
      case '吊销':
        return 'bg-red-50 text-red-700 border border-red-200'
      case '注销':
        return 'bg-gray-50 text-gray-700 border border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="text-[14px] font-semibold">搜索国内关联实体</SheetTitle>
          <p className="text-[11px] text-[#9ca3af] mt-1">数据来源：天眼查</p>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2 top-[10px] text-[#9ca3af]" />
            <input
              type="text"
              placeholder="搜索公司名、社信代码或法人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-sm border border-[#e5e7eb] bg-white pl-7 pr-2 text-[12px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((entity) => (
              <div
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className={`p-3 rounded-sm border-2 cursor-pointer transition-all ${
                  selectedEntity?.id === entity.id
                    ? 'border-[#2563eb] bg-blue-50'
                    : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#111827]">{entity.companyName}</p>
                    <div className="mt-1 space-y-0.5 text-[11px] text-[#6b7280]">
                      <p><span className="font-mono text-[#2563eb]">{entity.creditCode}</span> · {entity.legalPerson}</p>
                      <p>注册资本：<span className="font-mono">{entity.regCapital}</span></p>
                      {entity.industry && <p>行业：{entity.industry}</p>}
                    </div>
                  </div>
                  <span className={`h-fit rounded-sm px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${getStatusColor(entity.status)}`}>
                    {entity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {results.length === 0 && (
            <div className="py-8 text-center text-[12px] text-[#9ca3af]">无搜索结果</div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 border-t border-[#e5e7eb] pt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-8 rounded-sm border border-[#e5e7eb] text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedEntity}
              className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
            >
              确认关联
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
