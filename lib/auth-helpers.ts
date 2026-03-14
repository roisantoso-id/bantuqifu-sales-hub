import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * 获取当前会话用户
 * 供服务端组件或路由处理器使用
 */
export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // 获取用户的详细信息和权限
  const { data: user } = await supabase
    .from('users_auth')
    .select(
      `
      id,
      email,
      name,
      isActive,
      user_organizations(
        userId,
        organizationId,
        roleId,
        organizations:organizationId(
          id,
          code,
          name,
          site
        ),
        roles:roleId(
          id,
          code,
          name,
          role_permissions(
            permissions(
              id,
              code,
              name,
              module
            )
          )
        )
      )
    `
    )
    .eq('id', session.user.id)
    .single()

  if (!user || !user.isActive) {
    return null
  }

  return user
}

/**
 * 从请求中获取选定的租户 ID
 */
export function getSelectedTenantFromRequest(request?: Request): string | null {
  if (typeof window === 'undefined') {
    // 服务端：从 cookie 读取
    const cookieStore = cookies()
    return cookieStore.get('selectedTenant')?.value || null
  }
  return localStorage.getItem('selectedTenant')
}

/**
 * 获取用户在特定租户的权限
 */
export async function getUserPermissionsForTenant(
  userId: string,
  tenantId: string
) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data } = await supabase
    .from('user_organizations')
    .select(
      `
      roles(
        role_permissions(
          permissions(
            code,
            name,
            module
          )
        )
      )
    `
    )
    .eq('userId', userId)
    .eq('organizationId', tenantId)
    .single()

  if (!data?.roles?.role_permissions) {
    return []
  }

  return data.roles.role_permissions.map((rp: any) => rp.permissions)
}

/**
 * 权限检查函数（可用于前后端）
 */
export function hasPermission(
  permissions: any[],
  requiredPermissionCode: string
): boolean {
  return permissions.some((p) => p.code === requiredPermissionCode)
}

/**
 * 检查用户是否在租户中有特定角色
 */
export function hasRole(userOrgs: any[], tenantId: string, roleCode: string): boolean {
  const org = userOrgs.find((o) => o.organizationId === tenantId)
  return org?.roles?.code === roleCode
}
