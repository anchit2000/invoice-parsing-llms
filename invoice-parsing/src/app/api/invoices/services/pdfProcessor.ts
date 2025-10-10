import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import FormData from 'form-data';
import axios from 'axios';
import { db, logger } from '@/lib/db';

export default class PDFProcessor {
  uploadDir: string;
  apiUrl: string;
  imageDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.imageDir = process.env.IMAGE_DIR || './images';
    this.apiUrl = process.env.PDF_API_URL || 'http://localhost:8000/pdf-to-images/';
  }

  async processPDF(filePath: string) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Deduplication check
      const existing = await db.query('SELECT id FROM invoices WHERE file_hash = $1', [fileHash]);
      // if (existing.rows.length > 0) throw new Error('This file has already been processed');

      console.log('Uploading PDF to API for conversion...');

      // Node.js compatible FormData
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: path.basename(filePath),
        contentType: 'application/pdf',
      });

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json',
        },
        timeout: 60000,
      });

      const base64Images: string[] = response.data;

      // Save Base64 images to disk (optional)
      const pageImages = [];
      for (let i = 0; i < base64Images.length; i++) {
        const imgBuffer = Buffer.from(base64Images[i], 'base64');
        const imgPath = path.join(this.imageDir, `${fileHash}_page_${i + 1}.png`);
        await fs.writeFile(imgPath, imgBuffer);
        pageImages.push({ pageNumber: i + 1, path: imgPath });
        console.log(`Page ${i + 1} saved: ${imgPath}`);
      }

      return { fileHash, pages: pageImages, totalPages: base64Images.length, base64Images };
    } catch (error: any) {
      logger?.error('PDF processing error:', error?.message || error);
      throw error;
    }
  }

  async cleanup(fileHash: string) {
    try {
      const files = await fs.readdir(this.uploadDir);
      const toDelete = files.filter(f => f.startsWith(fileHash));
      await Promise.all(toDelete.map(f => fs.unlink(path.join(this.uploadDir, f))));
      console.log(`Cleanup complete for ${fileHash}`);
    } catch (error: any) {
      console.error(error);
      logger?.error('Cleanup error:', error?.message || error);
    }
  }
}
