import { NextResponse } from 'next/server';
import multer from 'multer';
import path from 'path';
import Bull from 'bull';
import auth from '@/middleware/auth';
import { db, logger } from '@/lib/db'; // adjust path
import pdfProcessor from '@/services/pdfProcessor';
import llmExtractor from '@/services/llmExtractor';
import validator from '@/services/validator';
import { promisify } from 'util';

// --- Multer setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

// --- Bull queue setup ---
const processingQueue = new Bull('invoice-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// --- Define POST handler ---
export const POST = auth(async (req: any) => {
  try {
    const formData = await promisify(upload.array('invoices', 10))(req);
    const { schemaId } = req.body;

    if (!schemaId) {
      return NextResponse.json({ success: false, error: 'Schema ID is required' }, { status: 400 });
    }

    if (!req.files?.length) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    const schemaResult = await db.query(
      'SELECT * FROM schemas WHERE id = $1 AND user_id = $2',
      [schemaId, req.user.id]
    );

    if (schemaResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Schema not found' }, { status: 404 });
    }

    const schema = schemaResult.rows[0];
    const jobs = [];

    for (const file of req.files) {
      const job = await processingQueue.add({
        userId: req.user.id,
        schemaId: schema.id,
        schema,
        filePath: file.path,
        fileName: file.originalname,
        fileSize: file.size
      });

      jobs.push({
        jobId: job.id,
        fileName: file.originalname,
        status: 'queued'
      });
    }

    return NextResponse.json({
      success: true,
      message: `${jobs.length} invoice(s) queued for processing`,
      jobs
    });
  } catch (error: any) {
    logger.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process upload' }, { status: 500 });
  }
});

// --- Queue processing logic ---
processingQueue.process(async (job) => {
  const { userId, schemaId, schema, filePath, fileName, fileSize } = job.data;
  let invoice;

  try {
    job.progress(10);
    const pdfData = await pdfProcessor.processPDF(filePath, fileName);
    job.progress(30);

    const invoiceResult = await db.query(
      `INSERT INTO invoices (schema_id, file_name, file_size, file_hash, storage_path, pages_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [schemaId, fileName, fileSize, pdfData.fileHash, filePath, pdfData.totalPages, 'processing']
    );
    invoice = invoiceResult.rows[0];
    job.progress(40);

    const imagePaths = pdfData.pages.map(p => p.enhancedPath);
    const extraction = await llmExtractor.retryExtraction(schema, imagePaths);
    job.progress(70);

    const validation = await validator.validateAllFields(extraction.data, schema);
    job.progress(85);

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

    for (const vr of validation.results) {
      await db.query(
        `INSERT INTO validation_logs (extraction_result_id, field_name, validation_code, is_valid, error_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          resultInsert.rows[0].id,
          vr.fieldName,
          schema.fields.find(f => f.name === vr.fieldName)?.validation || null,
          vr.isValid,
          vr.message
        ]
      );
    }

    await db.query(`UPDATE invoices SET status = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2`, ['completed', invoice.id]);
    await pdfProcessor.cleanup(pdfData.fileHash);
    job.progress(100);

    return { invoiceId: invoice.id, extractionId: resultInsert.rows[0].id, validation };
  } catch (error) {
    logger.error('Processing job failed:', error);
    if (invoice?.id) {
      await db.query(`UPDATE invoices SET status = $1 WHERE id = $2`, ['failed', invoice.id]);
    }
    throw error;
  }
});
