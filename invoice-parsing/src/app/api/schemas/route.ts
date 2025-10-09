import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'


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
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const result = await db.query(
      'SELECT * FROM schemas WHERE user_id = $1',
      [user.id]
    )
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    })
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json()
    
    const result = await db.query(
      'INSERT INTO schemas (user_id, name, fields) VALUES ($1, $2, $3) RETURNING *',
      [user.id, body.name, JSON.stringify(body.fields)]
    )
    
    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    }, { status: 201 })
  })
}


// routes/schemas.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// GET all schemas for user
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM schemas WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching schemas:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST create new schema
router.post('/', 
  auth,
  [
    body('name').notEmpty().trim().isLength({ max: 255 }),
    body('fields').isArray({ min: 1 }),
    body('fields.*.name').notEmpty().matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    body('fields.*.description').notEmpty(),
    body('fields.*.type').isIn(['string', 'number', 'date', 'email', 'currency', 'array'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, fields } = req.body;
    
    try {
      const result = await db.query(
        `INSERT INTO schemas (user_id, name, description, fields) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [req.user.id, name, description, JSON.stringify(fields)]
      );

      // Audit log
      await db.query(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'CREATE_SCHEMA', 'schema', result.rows[0].id]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error creating schema:', error);
      res.status(500).json({ success: false, error: 'Failed to create schema' });
    }
  }
);

// PUT update schema
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, description, fields } = req.body;

  try {
    const result = await db.query(
      `UPDATE schemas 
       SET name = $1, description = $2, fields = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [name, description, JSON.stringify(fields), id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Schema not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating schema:', error);
    res.status(500).json({ success: false, error: 'Failed to update schema' });
  }
});

// DELETE schema
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM schemas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Schema not found' });
    }

    res.json({ success: true, message: 'Schema deleted successfully' });
  } catch (error) {
    logger.error('Error deleting schema:', error);
    res.status(500).json({ success: false, error: 'Failed to delete schema' });
  }
});

module.exports = router;