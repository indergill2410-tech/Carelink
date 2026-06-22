import { NextRequest, NextResponse } from 'next/server'
import { provisionDemoAccounts } from '@/lib/provision-demo-accounts'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/demo-provision  — manually trigger demo account provisioning.
// Secured by requiring DEMO_ACCOUNT_PASSWORD in the request body so only
// operators can call it. Safe to call repeatedly (idempotent).
//
// Usage:
//   curl -X POST https://carelink-h1f9.onrender.com/api/demo-provision \
//        -d "token=<DEMO_ACCOUNT_PASSWORD>"
//
// Or visit /demo-provision in the browser (the form below is served via GET).
export async function POST(req: NextRequest) {
  if (process.env.ENABLE_DEMO_ACCOUNTS !== 'true') {
    return NextResponse.json({ error: 'Demo accounts are disabled.' }, { status: 404 })
  }

  const ip = getClientIp(req.headers)
  const rateLimit = checkRateLimit(`demo-provision:${ip}`, 3, 5 * 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
    )
  }

  const body = await req.formData().catch(() => null)
  const token = body?.get('token') as string | null

  const expected = process.env.DEMO_ACCOUNT_PASSWORD
  if (!expected) {
    return NextResponse.json({ error: 'DEMO_ACCOUNT_PASSWORD not configured' }, { status: 500 })
  }
  if (token !== expected) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  console.log('[demo] Manual provision triggered via /api/demo-provision')
  await provisionDemoAccounts(true)

  return NextResponse.redirect(new URL('/api/demo-status', req.url))
}

// GET — serve a minimal HTML form so operators can trigger provisioning from a browser
export async function GET() {
  if (process.env.ENABLE_DEMO_ACCOUNTS !== 'true') {
    return NextResponse.json({ error: 'Demo accounts are disabled.' }, { status: 404 })
  }

  const html = `<!DOCTYPE html>
<html>
<head><title>Demo Provision</title></head>
<body style="font-family:sans-serif;max-width:400px;margin:60px auto;padding:0 20px">
  <h2>Provision Demo Accounts</h2>
  <p>Enter your <code>DEMO_ACCOUNT_PASSWORD</code> to force-provision all demo accounts.</p>
  <form method="POST">
    <input name="token" type="password" placeholder="DEMO_ACCOUNT_PASSWORD"
           style="width:100%;padding:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box" />
    <button type="submit"
            style="width:100%;padding:10px;background:#0f766e;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">
      Provision Now
    </button>
  </form>
  <p style="font-size:12px;color:#666;margin-top:16px">
    After provisioning, <a href="/api/demo-status">check status</a> to confirm all accounts are ready.
  </p>
</body>
</html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}
