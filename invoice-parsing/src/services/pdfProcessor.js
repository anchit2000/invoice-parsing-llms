// services/pdfProcessor.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { fromPath } = require('pdf2pic');
const sharp = require('sharp');
const { db, logger } = require('../lib/db');

class PDFProcessor {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.imagesDir = process.env.IMAGES_DIR || './images';
  }

  async processPDF(filePath, fileName) {
    try {
      // Calculate file hash for deduplication
      const fileBuffer = await fs.readFile(filePath);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Check if file already processed
      const existing = await db.query(
        'SELECT id FROM invoices WHERE file_hash = $1',
        [fileHash]
      );

      if (existing.rows.length > 0) {
        throw new Error('This file has already been processed');
      }

      // Ensure images directory exists
      await fs.mkdir(this.imagesDir, { recursive: true });

      // Convert PDF to images
      const options = {
        density: 300,
        saveFilename: fileHash,
        savePath: this.imagesDir,
        format: 'png',
        width: 2480,
        height: 3508
      };

      const convert = fromPath(filePath, options);
      const pageImages = [];
      let pageNum = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        try {
          const result = await convert(pageNum, { responseType: 'image' });
          
          // Enhance image quality
          const enhancedPath = path.join(this.imagesDir, `${fileHash}_page_${pageNum}_enhanced.png`);
          await sharp(result.path)
            .normalize()
            .sharpen()
            .toFile(enhancedPath);

          pageImages.push({
            pageNumber: pageNum,
            originalPath: result.path,
            enhancedPath: enhancedPath
          });

          pageNum++;
        } catch (error) {
          hasMorePages = false;
        }
      }

      return {
        fileHash,
        pages: pageImages,
        totalPages: pageImages.length
      };

    } catch (error) {
      logger.error('PDF processing error:', error);
      throw error;
    }
  }

  async cleanup(fileHash) {
    try {
      const files = await fs.readdir(this.imagesDir);
      const toDelete = files.filter(f => f.startsWith(fileHash));
      
      await Promise.all(
        toDelete.map(f => fs.unlink(path.join(this.imagesDir, f)))
      );
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  }
}

module.exports = new PDFProcessor();