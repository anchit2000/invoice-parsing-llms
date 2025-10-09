// tests/integration/invoices.test.js
const request = require('supertest');
const app = require('../../server');

describe('Invoice Processing Integration Tests', () => {
  let authToken;
  let schemaId;

  beforeAll(async () => {
    // Setup test user and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    authToken = response.body.token;
  });

  describe('POST /api/schemas', () => {
    it('should create a new schema', async () => {
      const response = await request(app)
        .post('/api/schemas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Invoice Schema',
          fields: [
            {
              name: 'invoice_number',
              description: 'Invoice number',
              type: 'string',
              required: true
            },
            {
              name: 'total_amount',
              description: 'Total amount',
              type: 'currency',
              validation: 'value > 0'
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      schemaId = response.body.data.id;
    });
  });

  describe('POST /api/invoices/upload', () => {
    it('should upload and process an invoice', async () => {
      const response = await request(app)
        .post('/api/invoices/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('schemaId', schemaId)
        .attach('invoices', './tests/fixtures/sample_invoice.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.jobs).toHaveLength(1);
    });
  });
});