## Project Overview

This is an **Invoice Parsing Platform** built with **Next.js 14** that uses AI/LLM technology to extract structured data from PDF invoices. The project is designed as a comprehensive solution for automated invoice processing with customizable schemas and validation.

## Architecture & Technology Stack

### **Frontend**
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Zustand** for state management

### **Backend**
- **Next.js API Routes** for REST endpoints
- **PostgreSQL** database with connection pooling
- **Redis** for job queue management
- **Bull** for background job processing
- **Multer** for file uploads

### **AI/ML Services**
- **OpenAI GPT-4 Vision** for invoice data extraction
- **Anthropic Claude** as alternative LLM provider
- **Sharp** for image processing
- **PDF-Parse** for PDF text extraction

### **Authentication & Security**
- **JWT** tokens for authentication
- **bcryptjs** for password hashing
- **Zod** for data validation

## File Structure Breakdown

```
invoice-parsing/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Dashboard route group
│   │   │   ├── invoices/            # Invoice management pages
│   │   │   ├── results/             # Results viewing pages
│   │   │   ├── schemas/             # Schema management pages
│   │   │   └── settings/            # Settings pages
│   │   ├── api/                      # API routes
│   │   │   ├── invoices/            # Invoice-related endpoints
│   │   │   ├── metrics/             # System metrics
│   │   │   └── schemas/             # Schema management endpoints
│   │   └── globals.css              # Global styles
│   ├── lib/                         # Shared utilities
│   │   ├── auth/                    # Authentication middleware
│   │   └── db/                      # Database connection
│   ├── services/                    # Core business logic
│   │   ├── llmExtractor.js         # AI/LLM integration
│   │   ├── pdfProcessor.js         # PDF processing
│   │   └── validator.js            # Data validation
│   ├── monitoring/                  # System monitoring
│   ├── middleware.ts               # Next.js middleware
│   └── worker.js                   # Background job worker
├── tests/                          # Test files
├── db_schema.sql                   # Database schema
└── package.json                    # Dependencies
```

## Core Features

### 1. **Schema Management**
- Users can create custom schemas defining what data to extract from invoices
- Each schema contains field definitions with types, descriptions, and validation rules
- Supports various field types: string, number, currency, date, array, etc.

### 2. **Invoice Processing Pipeline**
- **Upload**: PDF files uploaded via web interface
- **Processing**: PDFs converted to images and processed by LLM
- **Extraction**: AI extracts structured data based on user-defined schemas
- **Validation**: Extracted data validated against schema rules
- **Storage**: Results stored in PostgreSQL with full audit trail

### 3. **Background Job Processing**
- Uses **Bull** queue with Redis for scalable processing
- Separate worker process handles heavy AI processing
- Progress tracking and error handling
- Configurable concurrency levels

### 4. **Multi-LLM Support**
- Supports both OpenAI GPT-4 Vision and Anthropic Claude
- Automatic retry logic with exponential backoff
- Confidence scoring for extracted data
- Token usage tracking

### 5. **Data Management**
- Comprehensive database schema with proper indexing
- Audit logging for all user actions
- Validation logs for data quality tracking
- File deduplication using hash-based storage

## Database Schema

The project uses a well-designed PostgreSQL schema with these main tables:

- **`users`**: User accounts and authentication
- **`schemas`**: Custom extraction schemas per user
- **`invoices`**: Uploaded invoice metadata
- **`extraction_results`**: AI-extracted data and metadata
- **`validation_logs`**: Field-level validation results
- **`audit_logs`**: System audit trail

## Key Components

### **LLM Extractor Service**
- Handles communication with OpenAI and Anthropic APIs
- Builds dynamic prompts based on user schemas
- Processes multi-page invoices
- Implements retry logic and error handling

### **PDF Processor**
- Converts PDF pages to high-quality images
- Handles text extraction for fallback processing
- Manages temporary file storage and cleanup

### **Validator Service**
- Validates extracted data against schema rules
- Supports custom validation logic
- Provides detailed error reporting

### **Worker Process**
- Separate Node.js process for background jobs
- Handles the complete invoice processing pipeline
- Implements graceful shutdown and error recovery

## Development & Testing

- **TypeScript** for type safety
- **ESLint** for code quality
- **Jest** and **Playwright** for testing
- **Integration tests** for API endpoints
- **Winston** for structured logging

## Deployment Considerations

- Environment variables for configuration
- Redis required for job queue
- PostgreSQL database
- File storage for uploads
- Separate worker process deployment

This is a production-ready, enterprise-grade invoice processing platform that combines modern web technologies with AI capabilities to provide automated document processing with high accuracy and scalability.