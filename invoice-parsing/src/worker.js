// worker.js
require('dotenv').config();
const Bull = require('bull');
const pdfProcessor = require('./services/pdfProcessor');
const llmExtractor = require('./services/llmExtractor');
const validator = require('./services/validator');

const processingQueue = new Bull('invoice-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

// Concurrency settings
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 2;

logger.info(`Worker started with concurrency: ${CONCURRENCY}`);

processingQueue.process(CONCURRENCY, async (job) => {
  const { userId, schemaId, schema, filePath, fileName, fileSize } = job.data;
  
  logger.info(`Processing job ${job.id} for user ${userId}`);

  try {
    // Processing logic (same as in routes/invoices.js)
    // ... (refer to the processingQueue.process implementation above)
    
    logger.info(`Job ${job.id} completed successfully`);
    
  } catch (error) {
    logger.error(`Job ${job.id} failed:`, error);
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
