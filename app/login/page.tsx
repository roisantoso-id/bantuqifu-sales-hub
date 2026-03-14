'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { AdaptiveLoginCard } from '@/components/login/adaptive-login-card'

const TENANTS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Bantu', code: 'ORG_ID: 00000001' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Rois & Co', code: 'ORG_ID: 00000002' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Kemayoran Habibi', code: 'ORG_ID: 00000003' },
]

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'id', label: 'ID' },
  { code: 'en', label: 'EN' },
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
    await new Promise(resolve => setTimeout(resolve, 800))
    
    localStorage.setItem('authToken', `token-${Date.now()}`)
    localStorage.setItem('currentTenant', selectedTenant.id)
    localStorage.setItem('currentSite', site)
    localStorage.setItem('userEmail', email)
    
    router.push('/')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email.trim() && password.trim()) {
      handleLogin()
    }
  }

  // 根据站点选择背景
  const backgroundImage = site === 'ID' 
    ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)'
    : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)'

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 lg:p-0 transition-all duration-300"
      style={{ background: backgroundImage }}
    >
      {/* 顶部语言切换 - 所有屏幕 */}
      <div className="absolute top-4 right-4 flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              language === lang.code
                ? 'bg-white text-[#1e3a8a]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* 左侧品牌展示区 - 宽屏只显示 */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center lg:px-12">
        <div className="mb-8 text-white">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bantu_logo_yuan-2L5IX7MXM9VF7K8Owk5CLW4mryzl89.png"
            alt="Bantu Logo"
            width={120}
            height={120}
            className="mb-6"
          />
          <h1 className="text-4xl font-bold mb-2">简化销售</h1>
          <h2 className="text-4xl font-bold mb-6">加速成交</h2>
          <p className="text-lg text-white/80">
            {site === 'ID' ? 'Bantu Indonesia Site' : 'Bantu 中国分站'}
          </p>
        </div>

        {/* 特性标签 */}
        <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <span>线索管理</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <span>商机追踪</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <span>客户360</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span>数据分析</span>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center text-white/80 border-t border-white/20 pt-8">
          <div>
            <div className="text-2xl font-bold text-white">500+</div>
            <div className="text-sm">企业用户</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">10万+</div>
            <div className="text-sm">管理商机</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">98%</div>
            <div className="text-sm">满意度</div>
          </div>
        </div>
      </div>

      {/* 右侧登录卡片 - 宽屏右侧，窄屏中间 */}
      <div className="flex flex-1 lg:flex-none items-center justify-center lg:px-12">
        <div onKeyPress={handleKeyPress}>
          <AdaptiveLoginCard
            site={site}
            onSiteChange={setSite}
            selectedTenant={selectedTenant}
            onTenantChange={setSelectedTenant}
            tenants={TENANTS}
            tenantOpen={tenantOpen}
            onTenantOpenChange={setTenantOpen}
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            showPassword={showPassword}
            onShowPasswordChange={setShowPassword}
            onSubmit={handleLogin}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 底部企业微信联系 - 仅宽屏 */}
      <div className="absolute bottom-4 left-4 hidden lg:flex items-center gap-2 text-white/60 text-[12px]">
        <MessageCircle size={14} />
        <span>企业微信服务</span>
      </div>
    </div>
  )
}
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0033cc] via-[#0044dd] to-[#0066ff] relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/3 rounded-full blur-2xl" />
        </div>
        
        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* 顶部 Logo */}
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

          {/* 中间主内容 */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              简化销售
              <br />
              <span className="text-white/90">加速成交</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              全流程企业销售管理平台，从线索到回款，一站式管理您的客户关系。
            </p>

            {/* 特性标签 */}
            <div className="mt-8 flex flex-wrap gap-2">
              {['线索管理', '商机追踪', '客户360°', '数据分析'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 底部统计 */}
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
      <div className="flex-1 flex flex-col bg-[#fafbfc]">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between px-8 py-4">
          {/* 移动端 Logo */}
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

          {/* 语言切换 */}
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

        {/* 登录表单 */}
        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <div className="w-full max-w-[400px]">
            {/* 欢迎标题 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">欢迎回来</h2>
              <p className="text-[#6b7280]">登录您的账号以继续使用 Bantu CRM</p>
            </div>

            {/* 站点切换 */}
            <div className="mb-6">
              <label className="text-[12px] font-medium text-[#6b7280] block mb-2">选择站点</label>
              <div className="flex gap-2">
                {(['ID', 'CN'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSite(s)}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      site === s
                        ? 'border-[#0044dd] bg-[#0044dd]/5'
                        : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
                    }`}
                  >
                    <div className={`text-[13px] font-semibold ${site === s ? 'text-[#0044dd]' : 'text-[#111827]'}`}>
                      {s === 'ID' ? '印尼站' : '中国站'}
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">
                      {s === 'ID' ? 'Indonesia Site' : 'China Site'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 组织选择 */}
            <div className="mb-4">
              <label className="text-[12px] font-medium text-[#6b7280] block mb-2">组织</label>
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

            {/* 邮箱/账号 */}
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

            {/* 密码 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-medium text-[#6b7280]">密码</label>
                <button className="text-[12px] text-[#0044dd] hover:underline">忘记密码？</button>
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

            {/* 登录按钮 */}
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

            {/* 分隔线 */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="text-[12px] text-[#9ca3af]">或</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>

            {/* 企业微信登录 */}
            <button className="w-full h-12 bg-white border border-[#e5e7eb] rounded-lg hover:border-[#d1d5db] hover:bg-[#f9fafb] text-[#111827] text-[14px] font-medium flex items-center justify-center gap-2 transition-all">
              <MessageCircle size={18} className="text-[#07c160]" />
              使用企业微信登录
            </button>

            {/* 底部信息 */}
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

        {/* 底部版权 */}
        <div className="px-8 py-4 text-center border-t border-[#e5e7eb]">
          <p className="text-[11px] text-[#9ca3af]">
            © 2024-2025 Bantu Qifu. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
