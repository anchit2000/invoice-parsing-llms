import { NextRequest, NextResponse } from 'next/server';
import Bull from 'bull';
import auth from '@/middleware/auth';
import { db, logger } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// --- Bull queue setup ---
const processingQueue = new Bull('invoice-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// --- Define POST handler ---
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
    const jobs = [];

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

      const job = await processingQueue.add({
        userId: req.user.id,
        schemaId: schema.id,
        schema,
        filePath,
        fileName: file.name,
        fileSize: file.size,
        fileHash
      });

      jobs.push({
        jobId: job.id,
        fileName: file.name,
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