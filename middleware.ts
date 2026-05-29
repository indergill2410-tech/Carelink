import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

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
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isFacility = pathname.startsWith('/facility')
  const isWorker = pathname.startsWith('/worker')
  const isProtected = isDashboard || isFacility || isWorker

  if (!isProtected) return response

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Try JWT claim first (set by the custom_access_token_hook in Supabase).
  // Fall back to a DB lookup via Supabase REST so this works before the hook is registered.
  let role: string | undefined = user.app_metadata?.role ?? user.user_metadata?.role

  if (!role) {
    console.warn("[Middleware] JWT role claim missing for user " + user.id + ". Falling back to database lookup. Ensure custom_access_token_hook is configured in Supabase.");
    const { data } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single()
    role = data?.role ?? undefined
  }

  if (isDashboard && role !== 'ADMIN') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Unauthorized')
    return NextResponse.redirect(url)
  }

  if (isFacility && role !== 'ADMIN') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Unauthorized')
    return NextResponse.redirect(url)
  }

  if (isWorker && !['NURSE', 'EN', 'PCA'].includes(role ?? '')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'Unauthorized')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
