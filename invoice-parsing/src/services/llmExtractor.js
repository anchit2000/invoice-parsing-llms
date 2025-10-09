// services/llmExtractor.js
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

class LLMExtractor {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.defaultModel = process.env.LLM_MODEL || 'gpt-4-vision-preview';
  }

  async extractFromInvoice(schema, imagePaths) {
    try {
      // Build the extraction prompt
      const prompt = this.buildExtractionPrompt(schema);

      // Prepare images
      const imageMessages = await this.prepareImages(imagePaths);

      // Call LLM API
      let response;
      if (this.defaultModel.startsWith('gpt')) {
        response = await this.extractWithOpenAI(prompt, imageMessages);
      } else if (this.defaultModel.startsWith('claude')) {
        response = await this.extractWithClaude(prompt, imageMessages);
      }

      // Parse and validate response
      const extractedData = this.parseResponse(response);
      
      return {
        data: extractedData,
        metadata: {
          model: this.defaultModel,
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          confidence: this.calculateConfidence(extractedData)
        }
      };

    } catch (error) {
      logger.error('LLM extraction error:', error);
      throw error;
    }
  }

  buildExtractionPrompt(schema) {
    const fields = schema.fields;
    const fieldDescriptions = fields.map(f => 
      `- "${f.name}" (${f.type}): ${f.description}${f.required ? ' [REQUIRED]' : ''}`
    ).join('\n');

    return `You are an expert AI system for extracting structured data from invoice documents.

TASK: Extract the following fields from the provided invoice image(s):

${fieldDescriptions}

INSTRUCTIONS:
1. Carefully analyze all pages of the invoice
2. Extract the exact values for each field as they appear in the document
3. For dates, use ISO 8601 format (YYYY-MM-DD)
4. For currency values, include only the numeric amount (no currency symbols)
5. For arrays, provide comma-separated values
6. If a field cannot be found, use null
7. Ensure accuracy - double-check all extracted values

OUTPUT FORMAT:
Return a valid JSON object with the following structure:
{
  ${fields.map(f => `"${f.name}": <${f.type}_value>`).join(',\n  ')}
}

CRITICAL: Your response must be valid JSON only. Do not include any explanatory text before or after the JSON.`;
  }

  async prepareImages(imagePaths) {
    const images = [];
    
    for (const imgPath of imagePaths) {
      const imageBuffer = await fs.readFile(imgPath);
      const base64Image = imageBuffer.toString('base64');
      images.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${base64Image}`,
          detail: 'high'
        }
      });
    }
    
    return images;
  }

  async extractWithOpenAI(prompt, imageMessages) {
    const response = await this.openai.chat.completions.create({
      model: this.defaultModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageMessages
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    return response.choices[0].message.content;
  }

  async extractWithClaude(prompt, imageMessages) {
    // Convert images to Claude format
    const claudeImages = await Promise.all(
      imageMessages.map(async (img) => {
        const base64Data = img.image_url.url.split(',')[1];
        return {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: base64Data
          }
        };
      })
    );

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...claudeImages
          ]
        }
      ]
    });

    return response.content[0].text;
  }

  parseResponse(response) {
    try {
      // Handle string response
      if (typeof response === 'string') {
        // Remove markdown code blocks if present
        let cleaned = response.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```\n?/g, '');
        }
        
        return JSON.parse(cleaned);
      }
      
      return response;
    } catch (error) {
      logger.error('Failed to parse LLM response:', error);
      throw new Error('Invalid JSON response from LLM');
    }
  }

  calculateConfidence(data) {
    // Simple confidence calculation based on null values
    const values = Object.values(data);
    const nonNullCount = values.filter(v => v !== null && v !== '').length;
    return nonNullCount / values.length;
  }

  async retryExtraction(schema, imagePaths, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Extraction attempt ${attempt}/${maxRetries}`);
        return await this.extractFromInvoice(schema, imagePaths);
      } catch (error) {
        lastError = error;
        logger.warn(`Extraction attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw new Error(`Extraction failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}

module.exports = new LLMExtractor();