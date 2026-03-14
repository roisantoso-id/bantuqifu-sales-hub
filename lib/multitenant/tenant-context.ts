import { cookies } from 'next/headers'

/**
 * 从 Cookie 中获取当前租户 ID
 * 这是多租户隔离的关键入口
 * 
 * 使用方式：在任何服务端函数中调用此函数确保租户隔离
 */
export function getCurrentTenantId(): string {
  const cookieStore = cookies()
  const tenantId = cookieStore.get('x-tenant-id')?.value
  
  if (!tenantId) {
    throw new Error('❌ 未选择租户或会话已过期。请重新登录并选择租户。')
  }
  
  return tenantId
}

/**
 * 从 Cookie 中获取当前组织代码 (BANTU_ID or BANTU_CN)
 */
export function getCurrentOrgCode(): string {
  const cookieStore = cookies()
  const code = cookieStore.get('x-org-code')?.value
  
  if (!code) {
    throw new Error('❌ 未找到组织代码')
  }
  
  return code
}

/**
 * 获取当前登录用户的权限列表
 * 用于前端权限检查
 */
export function getCurrentUserPermissions(): string[] {
  const cookieStore = cookies()
  const permissionsJson = cookieStore.get('x-user-permissions')?.value
  
  if (!permissionsJson) {
    return []
  }
  
  try {
    return JSON.parse(permissionsJson)
  } catch {
    return []
  }
}

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(requiredPermission: string): boolean {
  const permissions = getCurrentUserPermissions()
  return permissions.includes(requiredPermission)
}

/**
 * 设置租户上下文 Cookie
 * 在登录时调用
 */
export async function setTenantContext(
  tenantId: string,
  orgCode: string,
  permissions: string[] = [],
  expiresIn = 24 * 60 * 60 * 1000 // 24小时
) {
  const cookieStore = cookies()
  const maxAge = expiresIn / 1000
  
  cookieStore.set('x-tenant-id', tenantId, {
    maxAge,
    httpOnly: true,
    path: '/',
  })
  
  cookieStore.set('x-org-code', orgCode, {
    maxAge,
    httpOnly: true,
    path: '/',
  })
  
  if (permissions.length > 0) {
    cookieStore.set('x-user-permissions', JSON.stringify(permissions), {
      maxAge,
      httpOnly: true,
      path: '/',
    })
  }
}

/**
 * 清除租户上下文（登出时调用）
 */
export async function clearTenantContext() {
  const cookieStore = cookies()
  
  cookieStore.delete('x-tenant-id')
  cookieStore.delete('x-org-code')
  cookieStore.delete('x-user-permissions')
}
