'use client'

import { Eye, EyeOff, ChevronDown } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  code: string
}

interface AdaptiveLoginCardProps {
  site: 'ID' | 'CN'
  onSiteChange: (site: 'ID' | 'CN') => void
  selectedTenant: Tenant
  onTenantChange: (tenant: Tenant) => void
  tenants: Tenant[]
  tenantOpen: boolean
  onTenantOpenChange: (open: boolean) => void
  email: string
  onEmailChange: (email: string) => void
  password: string
  onPasswordChange: (password: string) => void
  showPassword: boolean
  onShowPasswordChange: (show: boolean) => void
  onSubmit: () => void
  isLoading: boolean
}

export function AdaptiveLoginCard({
  site,
  onSiteChange,
  selectedTenant,
  onTenantChange,
  tenants,
  tenantOpen,
  onTenantOpenChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onShowPasswordChange,
  onSubmit,
  isLoading,
}: AdaptiveLoginCardProps) {
  return (
    <div className="w-full max-w-[420px] rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
      {/* 站点选择 - 宽屏水平，窄屏垂直 */}
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:gap-3">
        <button
          onClick={() => onSiteChange('ID')}
          className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-center text-[13px] font-semibold transition-all lg:h-11 ${
            site === 'ID'
              ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
              : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#2563eb]'
          }`}
        >
          🇮🇩 Indonesia Site
        </button>
        <button
          onClick={() => onSiteChange('CN')}
          className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-center text-[13px] font-semibold transition-all lg:h-11 ${
            site === 'CN'
              ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
              : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#2563eb]'
          }`}
        >
          🇨🇳 China Site
        </button>
      </div>

      {/* 组织选择 */}
      <div className="mb-5">
        <label className="mb-1.5 block text-[12px] font-semibold text-[#6b7280]">选择组织</label>
        <div className="relative">
          <button
            onClick={() => onTenantOpenChange(!tenantOpen)}
            className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-left text-[13px] font-medium text-[#111827] hover:border-[#2563eb]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div>{selectedTenant.name}</div>
                <div className="font-mono text-[11px] text-[#9ca3af]">{selectedTenant.code}</div>
              </div>
              <ChevronDown size={16} className={`transition-transform ${tenantOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {tenantOpen && (
            <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    onTenantChange(tenant)
                    onTenantOpenChange(false)
                  }}
                  className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-[#f9fafb] border-b border-[#f3f4f6] last:border-b-0"
                >
                  <div className="font-medium text-[#111827]">{tenant.name}</div>
                  <div className="font-mono text-[11px] text-[#9ca3af]">{tenant.code}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 邮箱输入 */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[12px] font-semibold text-[#6b7280]">账号</label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="user@example.com"
          className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-[13px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
        />
      </div>

      {/* 密码输入 */}
      <div className="mb-5">
        <label className="mb-1.5 block text-[12px] font-semibold text-[#6b7280]">密码</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 pr-10 text-[13px] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
          />
          <button
            type="button"
            onClick={() => onShowPasswordChange(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* 登录按钮 */}
      <button
        onClick={onSubmit}
        disabled={!email.trim() || !password.trim() || isLoading}
        className="w-full rounded-lg bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] py-2.5 text-[13px] font-semibold text-white hover:shadow-lg disabled:bg-[#d1d5db] disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? '登录中...' : '登录'}
      </button>

      {/* 企业微信登录 */}
      <div className="mt-5 border-t border-[#e5e7eb] pt-5">
        <button className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]">
          🔗 企业微信登录
        </button>
      </div>

      {/* 版权信息 */}
      <div className="mt-4 text-center text-[11px] text-[#9ca3af]">
        © 2024 Bantu Indonesia. All rights reserved.
      </div>
    </div>
  )
}
