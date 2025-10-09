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
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'No token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      
      // Verify user still exists in database
      const userResult = await db.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 401 }
        );
      }

      const user = userResult.rows[0];
      
      // Add user to request object
      (req as AuthenticatedRequest).user = user;
      
      return handler(req as AuthenticatedRequest, context);
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  };
}
