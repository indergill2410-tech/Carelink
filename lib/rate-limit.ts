// Simple in-memory rate limiter (no Redis dependency for MVP)
// For production scale, swap to @upstash/ratelimit
const requests = new Map<string, { count: number; resetAt: number }>()

// Prune expired entries every 60s to prevent unbounded map growth
const pruneInterval = setInterval(() => {
  const now = Date.now()
  requests.forEach((entry, key) => {
    if (now > entry.resetAt) requests.delete(key)
  })
}, 60_000)
if (typeof pruneInterval === 'object' && pruneInterval !== null && 'unref' in pruneInterval) {
  ;(pruneInterval as any).unref()
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = requests.get(key)

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true }
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwardedFor) return forwardedFor

  const realIp = headers.get('x-real-ip')?.trim()
  return realIp || 'unknown'
}
