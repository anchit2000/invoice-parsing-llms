import { NextRequest, NextResponse } from 'next/server';
import auth from '@/middleware/auth';
import { db, logger } from '@/lib/db';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';

export const POST = auth(async (req) => {
  const { format, resultIds } = await req.json();

  if (!['json', 'csv', 'xlsx'].includes(format)) {
    return NextResponse.json({ success: false, error: 'Invalid format' }, { status: 400 });
  }

  try {
    const results = await db.query(
      `SELECT er.extracted_data, er.validation_results, i.file_name, i.uploaded_at
       FROM extraction_results er
       JOIN invoices i ON er.invoice_id = i.id
       JOIN schemas s ON i.schema_id = s.id
       WHERE er.id = ANY($1) AND s.user_id = $2`,
      [resultIds, req.user.id]
    );

    if (results.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No results found' }, { status: 404 });
    }

    let exportData, mimeType, filename;

    if (format === 'json') {
      exportData = JSON.stringify(results.rows, null, 2);
      mimeType = 'application/json';
      filename = `invoice_export_${Date.now()}.json`;
    } else if (format === 'csv') {
      const flattened = results.rows.map(r => ({ file_name: r.file_name, uploaded_at: r.uploaded_at, ...r.extracted_data }));
      const parser = new Parser();
      exportData = parser.parse(flattened);
      mimeType = 'text/csv';
      filename = `invoice_export_${Date.now()}.csv`;
    } else {
      const flattened = results.rows.map(r => ({ file_name: r.file_name, uploaded_at: r.uploaded_at, ...r.extracted_data }));
      const worksheet = XLSX.utils.json_to_sheet(flattened);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
      exportData = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `invoice_export_${Date.now()}.xlsx`;
    }

    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`
    });

    return new NextResponse(exportData, { headers });
  } catch (error: any) {
    logger.error('Export error:', error);
    return NextResponse.json({ success: false, error: 'Failed to export results' }, { status: 500 });
  }
});
