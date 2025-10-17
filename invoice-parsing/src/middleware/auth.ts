import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends NextRequest {
  user: User;
}

export default function auth(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');

      let user: User | null = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET not configured');
        }
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        const userResult = await db.query(
          'SELECT id, email, role FROM users WHERE id = $1',
          [decoded.userId]
        );
        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        }
      }

      // Guest fallback (no token): ensure a guest user exists and use it
      if (!user) {
        const guestEmail = 'guest@local';
        const upsert = await db.query(
          `INSERT INTO users (email, password_hash, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO UPDATE SET last_login = NOW()
           RETURNING id, email, role`,
          [guestEmail, 'guest', 'user']
        );
        user = upsert.rows[0];
      }

      (req as AuthenticatedRequest).user = user as User;
      return handler(req as AuthenticatedRequest, context);

    } catch (error: any) {
      console.error('Auth middleware error:', error);
      // As a last resort, allow anonymous to proceed without DB lookup
      (req as any).user = { id: null, email: 'anonymous', role: 'user' };
      return handler(req as any, context);
    }
  };
}
