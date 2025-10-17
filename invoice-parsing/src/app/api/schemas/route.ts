import { NextRequest, NextResponse } from 'next/server';
import auth from '@/middleware/auth';
import { db, logger } from '@/lib/db';
import { z } from 'zod';

const schemaSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(['string', 'number', 'date', 'email', 'currency', 'array']),
    validation: z.string().optional(),
    required: z.boolean().optional()
  })).min(1)
});

export const GET = auth(async (req) => {
  try {
    const result = await db.query(
      'SELECT * FROM schemas WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error: any) {
    logger.error('Error fetching schemas:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = auth(async (req) => {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = schemaSchema.parse(body);
    
    const result = await db.query(
      'INSERT INTO schemas (user_id, name, description, fields) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, validatedData.name, validatedData.description, JSON.stringify(validatedData.fields)]
    );

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'CREATE_SCHEMA', 'schema', result.rows[0].id]
    );
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    logger.error('Error creating schema:', error);
    return NextResponse.json({ success: false, error: 'Failed to create schema' }, { status: 500 });
  }
});