// worker.js
require('dotenv').config();
const Bull = require('bull');
const pdfProcessor = require('./services/pdfProcessor');
const llmExtractor = require('./services/llmExtractor');
const validator = require('./services/validator');
const { db, logger } = require('./lib/db');

const processingQueue = new Bull('invoice-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Concurrency settings
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 2;

logger.info(`Worker started with concurrency: ${CONCURRENCY}`);

processingQueue.process(CONCURRENCY, async (job) => {
  const { userId, schemaId, schema, filePath, fileName, fileSize, fileHash } = job.data;
  let invoice;
  
  logger.info(`Processing job ${job.id} for user ${userId}`);

  try {
    job.progress(10);
    const pdfData = await pdfProcessor.processPDF(filePath, fileName);
    job.progress(30);

    const invoiceResult = await db.query(
      `INSERT INTO invoices (schema_id, file_name, file_size, file_hash, storage_path, pages_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [schemaId, fileName, fileSize, fileHash, filePath, pdfData.totalPages, 'processing']
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

    logger.info(`Job ${job.id} completed successfully`);
    return { invoiceId: invoice.id, extractionId: resultInsert.rows[0].id, validation };
    
  } catch (error: any) {
    logger.error(`Job ${job.id} failed:`, error);
    if (invoice?.id) {
      await db.query(`UPDATE invoices SET status = $1 WHERE id = $2`, ['failed', invoice.id]);
    }
    throw error;
  }
});

// Event listeners
processingQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, result);
});

processingQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

processingQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...');
  await processingQueue.close();
  process.exit(0);
});

logger.info('Worker ready and waiting for jobs...');
