import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  id: string
  email: string
  role: string
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser> {
  // Check for token in Authorization header
  const authHeader = request.headers.get('authorization')
  
  // Also check cookies (for browser requests)
  const cookieToken = request.cookies.get('auth-token')?.value
  
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader || cookieToken

  if (!token) {
    throw new Error('No authorization token provided')
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Get user from database
    const result = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    return result.rows[0]
    
  } catch (jwtError) {
    // If JWT fails, check if it's an API key
    const apiKeyResult = await db.query(
      'SELECT id, email, role FROM users WHERE api_key = $1',
      [token]
    )

    if (apiKeyResult.rows.length === 0) {
      throw new Error('Invalid authentication token')
    }

    return apiKeyResult.rows[0]
  }
}

// Wrapper function for cleaner usage
export async function withAuth(
  request: NextRequest,
  handler: (user: AuthUser) => Promise<Response>
): Promise<Response> {
  try {
    const user = await authenticateRequest(request)
    return await handler(user)
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}