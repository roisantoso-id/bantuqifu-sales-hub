'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, ChevronDown, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const TENANTS = [
  { id: 'org_bantu_id', name: '班兔印尼', code: 'BANTU_ID', site: 'ID' },
  { id: 'org_bantu_cn', name: '班兔中国', code: 'BANTU_CN', site: 'CN' },
]

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'id', label: 'ID' },
  { code: 'en', label: 'EN' },
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedTenant, setSelectedTenant] = useState(TENANTS[0])
  const [tenantOpen, setTenantOpen] = useState(false)
  const [email, setEmail] = useState('admin@bantuqifu.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [language, setLanguage] = useState('zh')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    
    setIsLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (authError) {
        setError(authError.message || '登陆失败，请检查邮箱和密码')
        setIsLoading(false)
        return
      }

      if (data?.session) {
        localStorage.setItem('selectedTenant', selectedTenant.id)
        localStorage.setItem('selectedTenantName', selectedTenant.name)
        localStorage.setItem('currentSite', selectedTenant.site)
        router.push('/')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('登陆过程中出错，请稍后重试')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email.trim() && password.trim()) {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen flex bg-[#fafbfc]">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0033cc] via-[#0044dd] to-[#0066ff] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bantu_logo_yuan-2L5IX7MXM9VF7K8Owk5CLW4mryzl89.png"
              alt="Bantu Logo"
              width={48}
              height={48}
              className="rounded-full bg-white"
            />
            <span className="text-white text-xl font-bold tracking-tight">Bantu</span>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              简化销售<br />
              <span className="text-white/90">加速成交</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              全流程企业销售管理平台，从线索到回款，一站式管理您的客户关系。
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {['线索管理', '商机追踪', '客户360', '数据分析'].map((tag) => (
                <span key={tag} className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-12">
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-white/60 text-sm mt-1">企业用户</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">10万+</div>
              <div className="text-white/60 text-sm mt-1">商机管理</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-white/60 text-sm mt-1">客户满意度</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="lg:hidden flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bantu_logo_yuan-2L5IX7MXM9VF7K8Owk5CLW4mryzl89.png"
              alt="Bantu Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-[#0044dd] font-bold">Bantu</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-1 bg-white rounded-full px-1 py-1 border border-[#e5e7eb]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1 text-[12px] rounded-full transition-all ${
                  language === lang.code
                    ? 'bg-[#0044dd] text-white font-medium'
                    : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">欢迎回来</h2>
              <p className="text-[#6b7280]">登录您的账号以继续使用 Bantu CRM</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="text-[12px] font-medium text-[#6b7280] block mb-2">选择组织</label>
              <div className="relative">
                <button
                  onClick={() => setTenantOpen(!tenantOpen)}
                  className="w-full h-12 px-4 bg-white border border-[#e5e7eb] rounded-lg text-[14px] text-left text-[#111827] hover:border-[#0044dd] focus:border-[#0044dd] focus:ring-2 focus:ring-[#0044dd]/10 focus:outline-none transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{selectedTenant.name}</div>
                    <div className="font-mono text-[10px] text-[#9ca3af]">{selectedTenant.code}</div>
                  </div>
                  <ChevronDown size={18} className={`text-[#9ca3af] transition-transform ${tenantOpen ? 'rotate-180' : ''}`} />
                </button>

                {tenantOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-10 overflow-hidden">
                    {TENANTS.map((tenant) => (
                      <button
                        key={tenant.id}
                        onClick={() => {
                          setSelectedTenant(tenant)
                          setTenantOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#f9fafb] border-b border-[#f3f4f6] last:border-b-0 transition-colors ${
                          selectedTenant.id === tenant.id ? 'bg-[#0044dd]/5' : ''
                        }`}
                      >
                        <div className="font-medium text-[#111827]">{tenant.name}</div>
                        <div className="font-mono text-[10px] text-[#9ca3af]">{tenant.code}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[12px] font-medium text-[#6b7280] block mb-2">账号</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="admin@bantuqifu.com"
                className="w-full h-12 px-4 bg-white border border-[#e5e7eb] rounded-lg text-[14px] text-[#111827] placeholder-[#9ca3af] focus:border-[#0044dd] focus:ring-2 focus:ring-[#0044dd]/10 focus:outline-none transition-all"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium text-[#6b7280]">密码</label>
                <button className="text-[12px] text-[#0044dd] hover:underline">忘记密码?</button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的密码"
                  className="w-full h-12 px-4 pr-12 bg-white border border-[#e5e7eb] rounded-lg text-[14px] text-[#111827] placeholder-[#9ca3af] focus:border-[#0044dd] focus:ring-2 focus:ring-[#0044dd]/10 focus:outline-none transition-all"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af] hover:text-[#111827] transition-colors"
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={!email.trim() || !password.trim() || isLoading}
              className="w-full h-12 bg-[#0044dd] hover:bg-[#0033cc] disabled:bg-[#d1d5db] text-white text-[14px] font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="text-[12px] text-[#9ca3af]">或</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>

            <button className="w-full h-12 bg-white border border-[#e5e7eb] rounded-lg hover:border-[#d1d5db] hover:bg-[#f9fafb] text-[#111827] text-[14px] font-medium flex items-center justify-center gap-2 transition-all">
              <MessageCircle size={18} className="text-[#07c160]" />
              使用企业微信登录
            </button>

            <div className="mt-8 text-center">
              <p className="text-[12px] text-[#9ca3af]">
                登录即表示您同意我们的{' '}
                <a href="#" className="text-[#0044dd] hover:underline">服务条款</a>
                {' '}和{' '}
                <a href="#" className="text-[#0044dd] hover:underline">隐私政策</a>
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 text-center border-t border-[#e5e7eb]">
          <p className="text-[11px] text-[#9ca3af]">
            © 2024-2025 Bantu Qifu. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
