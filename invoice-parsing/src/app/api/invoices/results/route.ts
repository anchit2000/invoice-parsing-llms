import { NextResponse } from 'next/server';
import auth from '@/middleware/auth';
import { db, logger } from '@/lib/db';

export const GET = auth(async (req: any) => {
  const { searchParams } = new URL(req.url);
  const schemaId = searchParams.get('schemaId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT i.id as invoice_id, i.file_name, i.status, i.uploaded_at, i.processed_at,
             er.id as extraction_id, er.extracted_data, er.validation_results,
             er.confidence_score, s.name as schema_name
      FROM invoices i
      LEFT JOIN extraction_results er ON i.id = er.invoice_id
      LEFT JOIN schemas s ON i.schema_id = s.id
      WHERE s.user_id = $1
    `;
    const params: any[] = [req.user.id];

    if (schemaId) {
      query += ' AND i.schema_id = $2';
      params.push(schemaId);
    }

    query += ` ORDER BY i.uploaded_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM invoices i JOIN schemas s ON i.schema_id = s.id WHERE s.user_id = $1';
    const countParams: any[] = [req.user.id];
    if (schemaId) {
      countQuery += ' AND i.schema_id = $2';
      countParams.push(schemaId);
    }

    const countResult = await db.query(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].count) }
    });
  } catch (error) {
    logger.error('Results fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch results' }, { status: 500 });
  }
});
