import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const WORKER_ROLES = new Set(['NURSE', 'EN', 'PCA'])

function withNoStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

function getPortalForRole(role: string): string {
  if (role === 'ADMIN') return '/dashboard'
  if (role === 'FACILITY_ADMIN') return '/facility'
  if (WORKER_ROLES.has(role)) return '/worker'
  return '/login'
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isFacility = pathname.startsWith('/facility')
  const isWorker = pathname.startsWith('/worker')
  const isProtected = isDashboard || isFacility || isWorker

  if (!isProtected) return response

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Authentication is not configured.')
    return withNoStore(NextResponse.redirect(url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          origin: process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin,
        },
      },
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          const prev = response.cookies.getAll()
          response = NextResponse.next({ request: { headers: request.headers } })
          prev.forEach(c => response.cookies.set(c))
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          const prev = response.cookies.getAll()
          response = NextResponse.next({ request: { headers: request.headers } })
          prev.forEach(c => response.cookies.set(c))
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withNoStore(NextResponse.redirect(url))
  }

  // Try app_metadata first (set by admin API during provisioning or by the
  // custom_access_token_hook). Fall back to a DB lookup. Do not read
  // user_metadata for authorization because it is user-editable in Supabase.
  let role: string | undefined = user.app_metadata?.role

  if (!role) {
    // When the service role key is available use it to bypass RLS.
    // Otherwise reuse the existing supabase client which has the correct
    // auth context from the user's session cookies.
    let lookupClient = supabase
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      lookupClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          global: { headers: { origin: process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin } },
          cookies: { get: () => undefined, set: () => {}, remove: () => {} },
        }
      )
    }
    const { data } = await lookupClient
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()
    role = data?.role ?? undefined
    if (!role) console.warn('[Middleware] Role not found in DB for user', user.id)
  }

  const resolvedRole = role ?? ''

  // /dashboard — ADMIN only
  if (isDashboard && resolvedRole !== 'ADMIN') {
    return withNoStore(NextResponse.redirect(new URL(getPortalForRole(resolvedRole), request.url)))
  }

  // /facility — ADMIN or FACILITY_ADMIN
  if (isFacility && resolvedRole !== 'ADMIN' && resolvedRole !== 'FACILITY_ADMIN') {
    return withNoStore(NextResponse.redirect(new URL(getPortalForRole(resolvedRole), request.url)))
  }

  // /worker — NURSE, EN, PCA
  if (isWorker && !WORKER_ROLES.has(resolvedRole)) {
    return withNoStore(NextResponse.redirect(new URL(getPortalForRole(resolvedRole), request.url)))
  }

  return withNoStore(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
