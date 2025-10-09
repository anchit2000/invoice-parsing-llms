import { NextRequest, NextResponse } from 'next/server';
import auth from '@/middleware/auth';
import { db, logger } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import pdfProcessor from '@/services/pdfProcessor';
import llmExtractor from '@/services/llmExtractor';
import validator from '@/services/validator';

// Synchronous processing (no queue)

// // --- Define POST handler ---
export const POST = auth(async (req) => {
  try {
    const formData = await req.formData();
    const schemaId = formData.get('schemaId') as string;
    const files = formData.getAll('invoices') as File[];

    if (!schemaId) {
      return NextResponse.json({ success: false, error: 'Schema ID is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    // Validate file types
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json({ success: false, error: 'Only PDF files are allowed' }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'File size too large' }, { status: 400 });
      }
    }

    const schemaResult = await db.query(
      'SELECT * FROM schemas WHERE id = $1 AND user_id = $2',
      [schemaId, req.user.id]
    );

    if (schemaResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Schema not found' }, { status: 404 });
    }

    const schema = schemaResult.rows[0];
    const processed: any[] = [];

    // Create upload directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      // Generate unique filename
      const fileBuffer = await file.arrayBuffer();
      const fileHash = crypto.createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `${uniqueSuffix}${path.extname(file.name)}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file to disk
      await fs.writeFile(filePath, Buffer.from(fileBuffer));

      // Process PDF -> images
      const pdfData = await pdfProcessor.processPDF(filePath, file.name);
      // Insert invoice row (status processing)
      const invoiceResult = await db.query(
        `INSERT INTO invoices (schema_id, file_name, file_size, file_hash, storage_path, pages_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [schema.id, file.name, file.size, pdfData.fileHash, filePath, pdfData.totalPages, 'processing']
      );
      const invoice = invoiceResult.rows[0];

      // LLM extraction
      const imagePaths = pdfData.pages.map((p: any) => p.enhancedPath);
      const extraction = await llmExtractor.retryExtraction(schema, imagePaths);

      // Validation
      const validation = await validator.validateAllFields(extraction.data, schema);

      // Persist extraction
      const resultInsert = await db.query(
        `INSERT INTO extraction_results 
         (invoice_id, extracted_data, validation_results, llm_model, llm_prompt_tokens, llm_completion_tokens, confidence_score)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          invoice.id,
          JSON.stringify(extraction.data),
          JSON.stringify(validation),
          extraction.metadata.model,
          extraction.metadata.promptTokens,
          extraction.metadata.completionTokens,
          extraction.metadata.confidence
        ]
      );

      // Validation logs
      for (const vr of validation.results) {
        await db.query(
          `INSERT INTO validation_logs (extraction_result_id, field_name, validation_code, is_valid, error_message)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            resultInsert.rows[0].id,
            vr.fieldName,
            schema.fields.find((f: any) => f.name === vr.fieldName)?.validation || null,
            vr.isValid,
            vr.message
          ]
        );
      }

      // Mark invoice complete and cleanup
      await db.query(`UPDATE invoices SET status = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2`, ['completed', invoice.id]);
      await pdfProcessor.cleanup(pdfData.fileHash);

      processed.push({
        invoiceId: invoice.id,
        fileName: file.name,
        extractedData: extraction.data,
        validation,
        extractionId: resultInsert.rows[0].id
      });
    }

    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    logger.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process upload' }, { status: 500 });
  }
});
