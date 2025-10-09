import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth/jwt'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Upstash Redis rate limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'), // 100 requests per 15 minutes
})

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const pathname = request.nextUrl.pathname

  // 🧱 1️⃣ Rate limiting (only for /api/ routes)
  if (pathname.startsWith('/api/')) {
    const ip = request.ip ?? 'unknown'
    const { success } = await limiter.limit(ip)

    if (!success) {
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }
  }

  // 🧱 2️⃣ Authentication enforcement
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    try {
      await verifyAuth(token)
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 🧱 3️⃣ Redirect authenticated users away from auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      try {
        await verifyAuth(token)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch {
        // invalid token → continue
      }
    }
  }

  // 🧱 4️⃣ CORS + Security Headers (Helmet equivalent)
  const response = NextResponse.next()

  // CORS
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Helmet-like security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return response
}

export const config = {
  matcher: [
    '/api/:path*',     // Apply to all API routes
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
}
