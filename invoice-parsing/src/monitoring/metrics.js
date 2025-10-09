// monitoring/metrics.js
const prometheus = require('prom-client');

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const invoiceProcessingDuration = new prometheus.Histogram({
  name: 'invoice_processing_duration_seconds',
  help: 'Duration of invoice processing in seconds',
  labelNames: ['status'],
  buckets: [1, 5, 10, 30, 60, 120]
});

const llmApiCalls = new prometheus.Counter({
  name: 'llm_api_calls_total',
  help: 'Total number of LLM API calls',
  labelNames: ['model', 'status']
});

const validationResults = new prometheus.Counter({
  name: 'validation_results_total',
  help: 'Total validation results',
  labelNames: ['field', 'status']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(invoiceProcessingDuration);
register.registerMetric(llmApiCalls);
register.registerMetric(validationResults);

module.exports = {
  register,
  httpRequestDuration,
  invoiceProcessingDuration,
  llmApiCalls,
  validationResults
};