import { NextRequest, NextResponse } from 'next/server';
import auth from '@/middleware/auth';
import { db, logger } from '@/lib/db';

// ========================================
// GET /api/invoices/results/:id
// ========================================
export const GET = auth(async (req, { params }: { params: { id: string } }) => {
  const { id } = params;

  try {
    const result = await db.query(
      `
      SELECT 
        i.id AS invoice_id,
        i.file_name,
        i.status,
        i.uploaded_at,
        i.processed_at,
        er.id AS extraction_id,
        er.extracted_data,
        er.validation_results,
        er.llm_model,
        er.confidence_score,
        s.name AS schema_name,
        s.fields AS schema_fields
      FROM extraction_results er
      JOIN invoices i ON er.invoice_id = i.id
      JOIN schemas s ON i.schema_id = s.id
      WHERE er.id = $1 AND s.user_id = $2
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Result not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    logger.error('Result fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
});


// ========================================
// PUT /api/invoices/results/:id
// ========================================
export const PUT = auth(async (req, { params }: { params: { id: string } }) => {
  const { id } = params;

  try {
    const body = await req.json();
    const { extractedData } = body;

    if (!extractedData) {
      return NextResponse.json(
        { success: false, error: 'Missing extractedData field' },
        { status: 400 }
      );
    }

    // Verify ownership: result must belong to the same user
    const ownershipCheck = await db.query(
      `
      SELECT er.id 
      FROM extraction_results er
      JOIN invoices i ON er.invoice_id = i.id
      JOIN schemas s ON i.schema_id = s.id
      WHERE er.id = $1 AND s.user_id = $2
      `,
      [id, req.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Result not found' }, { status: 404 });
    }

    // Update extracted data
    const updated = await db.query(
      `
      UPDATE extraction_results 
      SET extracted_data = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [JSON.stringify(extractedData), id]
    );

    // Log audit trail
    await db.query(
      `
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [req.user.id, 'UPDATE_EXTRACTION', 'extraction_result', id]
    );

    return NextResponse.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error: any) {
    logger.error('Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update extraction result' },
      { status: 500 }
    );
  }
});
