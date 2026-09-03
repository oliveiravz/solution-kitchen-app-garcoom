export interface TenantBranding {
  tenantId?: string
  name: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  faviconUrl?: string
  subDomain?: string
  domainCustom?: string
}

export const defaultBranding: TenantBranding = {
  name: 'Solution Kitchen',
  primaryColor: '#ea580c',
  secondaryColor: '#27272a',
  logoUrl: '/logo-lockup.svg',
  faviconUrl: '/favicon.svg?v=2',
}

export const mockRestaurantBranding: TenantBranding = {
  tenantId: '11111111-1111-1111-1111-111111111111',
  name: 'Bistrô da Praça',
  logoUrl: '/logo-lockup.svg',
  primaryColor: '#0F3C76',
  secondaryColor: '#422006',
  faviconUrl: '/favicon.svg?v=2',
  subDomain: 'bistrodapraca',
}

function toBranding(value: unknown): TenantBranding {
  if (!value || typeof value !== 'object') return defaultBranding

  const data = value as Record<string, unknown>
  const stringValue = (...keys: string[]) => {
    const result = keys.map((key) => data[key]).find((item) => typeof item === 'string')
    return typeof result === 'string' ? result : undefined
  }

  return {
    ...defaultBranding,
    tenantId: stringValue('tenantId'),
    name: stringValue('name')?.trim() || defaultBranding.name,
    logoUrl: stringValue('logoUrl') ?? defaultBranding.logoUrl,
    primaryColor: stringValue('primaryColor') ?? defaultBranding.primaryColor, 
    secondaryColor: stringValue('secondaryColor') ?? defaultBranding.secondaryColor,
    faviconUrl: stringValue('faviconUrl') ?? defaultBranding.faviconUrl,
    subDomain: stringValue('subDomain'),
    domainCustom: stringValue('domainCustom'),
  }
}

export async function loadBranding(host: string): Promise<TenantBranding> {
  const baseUrl = import.meta.env.VITE_BFF_OPERACIONAL_URL || 'http://localhost:5159'
  const endpoint = new URL('/api/tenants/branding', baseUrl)
  endpoint.searchParams.set('host', host)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(endpoint, { signal: controller.signal })
    if (!response.ok) return defaultBranding
    return toBranding(await response.json())
  } catch {
    return defaultBranding
  } finally {
    window.clearTimeout(timeout)
  }
}

function isColor(value: string) {
  return typeof CSS === 'undefined' || CSS.supports('color', value)
}

export function applyBranding(branding: TenantBranding) {
  const primary = isColor(branding.primaryColor) ? branding.primaryColor : defaultBranding.primaryColor
  const secondary = isColor(branding.secondaryColor) ? branding.secondaryColor : defaultBranding.secondaryColor
  const root = document.documentElement

  root.style.setProperty('--color-primary', primary)
  root.style.setProperty('--color-secondary', secondary)
  document.title = `${branding.name} · Garçom`

  if (branding.faviconUrl) {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    favicon?.setAttribute('href', branding.faviconUrl)
  }
}