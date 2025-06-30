import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './lib/supabase'

// List of paths that require fraud checking
const PROTECTED_PATHS = [
  '/register',
  '/login',
  '/api/auth/signup',
  '/api/auth/signin'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only check protected paths
  if (!PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get client IP
  const clientIP = getClientIP(request)
  
  if (!clientIP) {
    return NextResponse.next()
  }

  try {
    // Check if IP is banned
    const { data: isBanned } = await supabase.rpc('is_ip_banned', { 
      check_ip: clientIP 
    })

    if (isBanned) {
      // Return immediate ban message
      return new NextResponse(
        JSON.stringify({
          error: "We don't onboard bots or bullshit. This IP is permanently blocked.",
          banned: true,
          code: "IP_BANNED"
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'X-Banned-IP': clientIP,
            'X-Ban-Reason': 'Fraud Detection'
          }
        }
      )
    }

    // Check rate limits for signup paths
    if (pathname.includes('register') || pathname.includes('signup')) {
      const { data: attempts } = await supabase
        .from('signup_attempts')
        .select('id')
        .eq('ip_address', clientIP)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour

      const attemptCount = attempts?.length || 0

      if (attemptCount >= 10) {
        // Too many attempts - soft rate limit
        return new NextResponse(
          JSON.stringify({
            error: "Too many signup attempts. Try again later.",
            code: "RATE_LIMITED"
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '3600', // 1 hour
              'X-Rate-Limited-IP': clientIP
            }
          }
        )
      }
    }

    // Continue to the route
    const response = NextResponse.next()
    
    // Add security headers
    response.headers.set('X-Client-IP', clientIP)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response

  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow through but log
    return NextResponse.next()
  }
}

function getClientIP(request: NextRequest): string {
  // Try various headers in order of preference
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'true-client-ip',
    'forwarded'
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // Take first IP if comma-separated
      const ip = value.split(',')[0].trim()
      if (ip && ip !== 'unknown') {
        return ip
      }
    }
  }

  // Fallback to request IP
  return request.ip || '127.0.0.1'
}

export const config = {
  matcher: [
    '/register/:path*',
    '/login/:path*',
    '/api/auth/:path*'
  ]
}
