import { NextRequest, NextResponse } from 'next/server';
import Bull from 'bull';
import auth from '@/middleware/auth';
import { logger } from '@/lib/db';

const processingQueue = new Bull('invoice-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

export const GET = auth(async (req, { params }: { params: { jobId: string } }) => {
  try {
    const { jobId } = params;
    const job = await processingQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        state,
        progress,
        result,
        failedReason: job.failedReason
      }
    });
  } catch (error) {
    logger.error('Job status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch job status' }, { status: 500 });
  }
});
