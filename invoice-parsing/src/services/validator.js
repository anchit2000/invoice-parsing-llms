// services/validator.js
const { VM } = require('vm2');

class ValidationService {
  constructor() {
    this.vmOptions = {
      timeout: 1000,
      sandbox: {
        console: {
          log: () => {},
          error: () => {}
        }
      }
    };
  }

  async validateField(fieldName, value, validationCode, fieldType) {
    if (!validationCode || validationCode.trim() === '') {
      return {
        fieldName,
        isValid: true,
        message: 'No validation defined'
      };
    }

    try {
      // Type coercion
      const typedValue = this.coerceType(value, fieldType);

      // Create sandboxed VM
      const vm = new VM({
        ...this.vmOptions,
        sandbox: {
          ...this.vmOptions.sandbox,
          value: typedValue
        }
      });

      // Execute validation code
      const result = vm.run(`(function() { return ${validationCode}; })()`);

      return {
        fieldName,
        isValid: Boolean(result),
        message: result ? 'Validation passed' : 'Validation failed',
        value: typedValue
      };

    } catch (error) {
      logger.error(`Validation error for field ${fieldName}:`, error);
      return {
        fieldName,
        isValid: false,
        message: `Validation error: ${error.message}`,
        error: error.message
      };
    }
  }

  coerceType(value, type) {
    if (value === null || value === undefined) return null;

    switch (type) {
      case 'number':
      case 'currency':
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      
      case 'array':
        return Array.isArray(value) ? value : String(value).split(',').map(s => s.trim());
      
      case 'string':
      case 'email':
      default:
        return String(value);
    }
  }

  async validateAllFields(extractedData, schema) {
    const validationPromises = schema.fields.map(field => 
      this.validateField(
        field.name,
        extractedData[field.name],
        field.validation,
        field.type
      )
    );

    const results = await Promise.all(validationPromises);
    
    return {
      results,
      allValid: results.every(r => r.isValid),
      validCount: results.filter(r => r.isValid).length,
      totalCount: results.length
    };
  }

  // Built-in validators
  static validators = {
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    phone: (value) => /^[\d\s\-\+\(\)]+$/.test(value),
    url: (value) => /^https?:\/\/.+/.test(value),
    notEmpty: (value) => value !== null && value !== undefined && String(value).trim() !== '',
    minLength: (min) => (value) => String(value).length >= min,
    maxLength: (max) => (value) => String(value).length <= max,
    range: (min, max) => (value) => value >= min && value <= max,
    pattern: (regex) => (value) => new RegExp(regex).test(value)
  };
}

module.exports = new ValidationService();