const PROD_COOKIE_DOMAIN = '.oabantuqifu.com'

export function getCookieDomain() {
  return process.env.NODE_ENV === 'production' ? PROD_COOKIE_DOMAIN : undefined
}

export function applyCookieDomain<T extends Record<string, any>>(options: T): T {
  const domain = getCookieDomain()

  if (!domain) {
    return options
  }

  return {
    ...options,
    domain,
  }
}
