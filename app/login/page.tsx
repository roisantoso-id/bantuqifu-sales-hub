'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Globe, MessageCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TENANTS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Bantu', code: 'ORG_ID: 00000001' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Rois & Co', code: 'ORG_ID: 00000002' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Kemayoran Habibi', code: 'ORG_ID: 00000003' },
]

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'English' },
]

export default function LoginPage() {
  const router = useRouter()
  const [site, setSite] = useState<'ID' | 'CN'>('ID')
  const [selectedTenant, setSelectedTenant] = useState(TENANTS[0])
  const [tenantOpen, setTenantOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [language, setLanguage] = useState('zh')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    setIsLoading(true)
    // 模拟登录延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 保存认证状态
    localStorage.setItem('authToken', `token-${Date.now()}`)
    localStorage.setItem('currentTenant', selectedTenant.id)
    localStorage.setItem('currentSite', site)
    localStorage.setItem('userEmail', email)
    
    // 重定向到主应用
    router.push('/')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email.trim() && password.trim()) {
      handleLogin()
    }
  }

  const siteLabel = site === 'ID' ? '印尼站点 (ID Site)' : '中国站点 (CN Site)'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 顶部导航栏 */}
      <div className="border-b border-[#e5e7eb] px-6 py-3 flex items-center justify-between">
        <div className="text-[15px] font-semibold text-[#111827]">Bantu CRM</div>
        <div className="flex items-center gap-3">
          {/* 语言选择 */}
          <div className="flex gap-1 border-l border-[#e5e7eb] pl-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-1 text-[11px] rounded-sm transition-colors ${
                  language === lang.code
                    ? 'bg-[#eff6ff] text-[#2563eb] font-medium'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主容器 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="text-[24px] font-bold text-[#111827] mb-1">Bantu</div>
            <div className="text-[13px] text-[#6b7280]">Enterprise Sales Management System</div>
          </div>

          {/* 登录卡片 */}
          <div className="border border-[#e5e7eb] rounded-sm bg-white p-6">
            <div className="space-y-4">
              {/* 站点选择 */}
              <div>
                <label className="text-[12px] font-semibold text-[#111827] block mb-2">工作站点</label>
                <div className="inline-flex border border-[#e5e7eb] rounded-sm p-1">
                  {(['ID', 'CN'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSite(s)}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-sm transition-colors ${
                        site === s
                          ? 'bg-[#2563eb] text-white'
                          : 'text-[#6b7280] hover:text-[#111827]'
                      }`}
                    >
                      {s === 'ID' ? '印尼' : '中国'} Site
                    </button>
                  ))}
                </div>
                <div className="mt-1 font-mono text-[10px] text-[#9ca3af]">Site ID: {site}</div>
              </div>

              {/* 租户选择 */}
              <div>
                <label className="text-[12px] font-semibold text-[#111827] block mb-2">组织</label>
                <div className="relative">
                  <button
                    onClick={() => setTenantOpen(!tenantOpen)}
                    className="w-full h-9 px-3 border border-[#e5e7eb] rounded-sm bg-white text-[13px] text-left text-[#111827] hover:border-[#2563eb] focus:border-[#2563eb] focus:outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <span>{selectedTenant.name}</span>
                      <span className="text-[#9ca3af]">▼</span>
                    </div>
                  </button>

                  {tenantOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 border border-[#e5e7eb] rounded-sm bg-white shadow-sm z-10">
                      {TENANTS.map((tenant) => (
                        <button
                          key={tenant.id}
                          onClick={() => {
                            setSelectedTenant(tenant)
                            setTenantOpen(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-[13px] hover:bg-[#f9fafb] border-b border-[#f3f4f6] last:border-b-0 transition-colors ${
                            selectedTenant.id === tenant.id ? 'bg-[#eff6ff]' : ''
                          }`}
                        >
                          <div className="font-medium text-[#111827]">{tenant.name}</div>
                          <div className="font-mono text-[10px] text-[#9ca3af]">{tenant.code}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-1 font-mono text-[10px] text-[#9ca3af]">{selectedTenant.code}</div>
              </div>

              {/* 分隔线 */}
              <div className="border-t border-[#e5e7eb]" />

              {/* 邮箱/账号 */}
              <div>
                <label htmlFor="email" className="text-[12px] font-semibold text-[#111827] block mb-2">
                  账号
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="admin@bantuqifu.com"
                  className="w-full h-9 px-3 border border-[#e5e7eb] rounded-sm bg-white text-[13px] text-[#111827] placeholder-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
                />
              </div>

              {/* 密码 */}
              <div>
                <label htmlFor="password" className="text-[12px] font-semibold text-[#111827] block mb-2">
                  密码
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="••••••••"
                    className="w-full h-9 px-3 pr-10 border border-[#e5e7eb] rounded-sm bg-white text-[13px] text-[#111827] placeholder-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#111827]"
                    type="button"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 登录按钮 */}
              <button
                onClick={handleLogin}
                disabled={!email.trim() || !password.trim() || isLoading}
                className="w-full h-10 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] text-white text-[13px] font-semibold rounded-sm transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    立即进入系统
                  </>
                )}
              </button>
            </div>

            {/* 分隔线 */}
            <div className="my-4 flex items-center gap-2">
              <div className="flex-1 border-t border-[#e5e7eb]" />
              <span className="text-[11px] text-[#9ca3af]">其他登录方式</span>
              <div className="flex-1 border-t border-[#e5e7eb]" />
            </div>

            {/* 企业微信登录 */}
            <button className="w-full h-9 border border-[#e5e7eb] rounded-sm bg-white hover:bg-[#f9fafb] text-[#111827] text-[12px] font-medium flex items-center justify-center gap-2 transition-colors">
              <MessageCircle size={14} />
              企业微信登录
            </button>
          </div>

          {/* 底部信息 */}
          <div className="mt-6 text-center text-[11px] text-[#9ca3af] space-y-1">
            <div>© 2024-2025 Bantu Qifu. All rights reserved.</div>
            <div className="flex items-center justify-center gap-2">
              <span>Powered by</span>
              <a href="#" className="text-[#2563eb] hover:underline">
                Vercel
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
