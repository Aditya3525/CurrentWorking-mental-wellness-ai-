import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'url' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[] | number[];
  custom?: (value: any) => boolean | string;
  sanitize?: boolean;
  allowHTML?: boolean;
}

export interface SanitizationConfig {
  enabled: boolean;
  allowedTags: string[];
  allowedAttributes: { [key: string]: string[] };
  removeEmptyTags: boolean;
  trimWhitespace: boolean;
  normalizeEmail: boolean;
  escapeSQLChars: boolean;
}

export interface ValidationMetrics {
  totalValidations: number;
  validationFailures: number;
  sanitizedInputs: number;
  blockedXSSAttempts: number;
  blockedSQLInjections: number;
  fieldValidationStats: Map<string, { total: number; failures: number }>;
}

export class InputValidationService {
  private config: SanitizationConfig;
  private metrics: ValidationMetrics = {
    totalValidations: 0,
    validationFailures: 0,
    sanitizedInputs: 0,
    blockedXSSAttempts: 0,
    blockedSQLInjections: 0,
    fieldValidationStats: new Map()
  };

  constructor(config: SanitizationConfig = {
    enabled: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote'],
    allowedAttributes: {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'title'],
      'blockquote': ['cite']
    },
    removeEmptyTags: true,
    trimWhitespace: true,
    normalizeEmail: true,
    escapeSQLChars: true
  }) {
    this.config = config;
  }

  /**
   * Create validation middleware for request body
   */
  validateBody(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      const errors = this.validateObject(req.body, rules);
      
      if (errors.length > 0) {
        this.metrics.validationFailures++;
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      // Sanitize the validated data
      req.body = this.sanitizeObject(req.body, rules);
      next();
    };
  }

  /**
   * Create validation middleware for query parameters
   */
  validateQuery(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      const errors = this.validateObject(req.query, rules);
      
      if (errors.length > 0) {
        this.metrics.validationFailures++;
        return res.status(400).json({
          error: 'Query validation failed',
          details: errors
        });
      }

      // Sanitize the validated data
      req.query = this.sanitizeObject(req.query, rules);
      next();
    };
  }

  /**
   * Create validation middleware for URL parameters
   */
  validateParams(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      const errors = this.validateObject(req.params, rules);
      
      if (errors.length > 0) {
        this.metrics.validationFailures++;
        return res.status(400).json({
          error: 'Parameter validation failed',
          details: errors
        });
      }

      // Sanitize the validated data
      req.params = this.sanitizeObject(req.params, rules);
      next();
    };
  }

  /**
   * Validate object against rules
   */
  private validateObject(data: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];
    this.metrics.totalValidations++;

    for (const rule of rules) {
      const value = data[rule.field];
      
      // Track field statistics
      const fieldStats = this.metrics.fieldValidationStats.get(rule.field) || { total: 0, failures: 0 };
      fieldStats.total++;

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        fieldStats.failures++;
        continue;
      }

      // Skip validation if field is not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        this.metrics.fieldValidationStats.set(rule.field, fieldStats);
        continue;
      }

      // Type validation
      const typeError = this.validateType(rule.field, value, rule.type);
      if (typeError) {
        errors.push(typeError);
        fieldStats.failures++;
      }

      // Length validation for strings
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
          fieldStats.failures++;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be no more than ${rule.maxLength} characters long`);
          fieldStats.failures++;
        }
      }

      // Numeric range validation
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
          fieldStats.failures++;
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} must be no more than ${rule.max}`);
          fieldStats.failures++;
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
          fieldStats.failures++;
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}`);
        fieldStats.failures++;
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (typeof customResult === 'string') {
          errors.push(customResult);
          fieldStats.failures++;
        } else if (customResult === false) {
          errors.push(`${rule.field} failed custom validation`);
          fieldStats.failures++;
        }
      }

      // Security checks
      if (typeof value === 'string') {
        if (this.detectXSS(value)) {
          errors.push(`${rule.field} contains potentially dangerous content`);
          fieldStats.failures++;
          this.metrics.blockedXSSAttempts++;
        }

        if (this.detectSQLInjection(value)) {
          errors.push(`${rule.field} contains potentially dangerous SQL content`);
          fieldStats.failures++;
          this.metrics.blockedSQLInjections++;
        }
      }

      this.metrics.fieldValidationStats.set(rule.field, fieldStats);
    }

    return errors;
  }

  /**
   * Validate data type
   */
  private validateType(fieldName: string, value: any, expectedType: string): string | null {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return `${fieldName} must be a string`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${fieldName} must be a valid number`;
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !validator.isEmail(value)) {
          return `${fieldName} must be a valid email address`;
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !validator.isURL(value)) {
          return `${fieldName} must be a valid URL`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${fieldName} must be a boolean`;
        }
        break;

      case 'date':
        if (!validator.isISO8601(String(value))) {
          return `${fieldName} must be a valid ISO 8601 date`;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return `${fieldName} must be an array`;
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `${fieldName} must be an object`;
        }
        break;

      default:
        return `Unknown validation type: ${expectedType}`;
    }

    return null;
  }

  /**
   * Sanitize object based on rules
   */
  private sanitizeObject(data: any, rules: ValidationRule[]): any {
    const sanitized = { ...data };

    for (const rule of rules) {
      const value = sanitized[rule.field];
      
      if (value !== undefined && value !== null) {
        if (rule.sanitize !== false) {
          sanitized[rule.field] = this.sanitizeValue(value, rule);
          this.metrics.sanitizedInputs++;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize individual value
   */
  private sanitizeValue(value: any, rule: ValidationRule): any {
    if (typeof value !== 'string') {
      return value;
    }

    let sanitized = value;

    // Trim whitespace
    if (this.config.trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Normalize email
    if (rule.type === 'email' && this.config.normalizeEmail) {
      sanitized = validator.normalizeEmail(sanitized) || sanitized;
    }

    // HTML sanitization
    if (rule.allowHTML) {
      sanitized = this.sanitizeHTML(sanitized);
    } else {
      // Escape HTML entities
      sanitized = this.escapeHTML(sanitized);
    }

    // SQL character escaping
    if (this.config.escapeSQLChars) {
      sanitized = this.escapeSQLChars(sanitized);
    }

    // Additional cleaning based on type
    switch (rule.type) {
      case 'url':
        sanitized = this.sanitizeURL(sanitized);
        break;
      case 'string':
        sanitized = this.sanitizeString(sanitized);
        break;
    }

    return sanitized;
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHTML(html: string): string {
    const config = {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: Object.keys(this.config.allowedAttributes).reduce((acc, tag) => {
        this.config.allowedAttributes[tag].forEach(attr => {
          acc.push(attr);
        });
        return acc;
      }, [] as string[]),
      REMOVE_EMPTY_TAGS: this.config.removeEmptyTags
    };

    return DOMPurify.sanitize(html, config);
  }

  /**
   * Escape HTML entities
   */
  private escapeHTML(text: string): string {
    const htmlEntities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return text.replace(/[&<>"'/]/g, (match) => htmlEntities[match]);
  }

  /**
   * Escape SQL characters
   */
  private escapeSQLChars(text: string): string {
    return text
      .replace(/'/g, "''")        // Escape single quotes
      .replace(/\\/g, '\\\\')     // Escape backslashes
      .replace(/\x00/g, '\\0')    // Escape null bytes
      .replace(/\n/g, '\\n')      // Escape newlines
      .replace(/\r/g, '\\r')      // Escape carriage returns
      .replace(/\x1a/g, '\\Z');   // Escape ctrl+Z
  }

  /**
   * Sanitize URL
   */
  private sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }

      return parsed.toString();
    } catch (error) {
      return '';
    }
  }

  /**
   * Sanitize string content
   */
  private sanitizeString(text: string): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\u00A0/g, ' ') // Replace non-breaking space with regular space
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Detect XSS attempts
   */
  private detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*onerror/gi,
      /<svg[^>]*onload/gi,
      /expression\s*\(/gi,
      /@import/gi,
      /behaviour\s*:/gi,
      /-moz-binding/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Detect SQL injection attempts
   */
  private detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*[=<>]\s*\d+)/gi,
      /(--[^\r\n]*|\/\*[\w\W]*?\*\/)/gi,
      /(\bor\b\s+\b1\b\s*=\s*\b1\b)/gi,
      /(\bunion\b\s+\bselect\b)/gi,
      /(\bdrop\b\s+\btable\b)/gi,
      /(\binsert\b\s+\binto\b)/gi,
      /(;[\s]*\b(drop|delete|insert|update|create)\b)/gi,
      /(\bwaitfor\b\s+\bdelay\b)/gi,
      /(\bsp_\w+)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Comprehensive input sanitization middleware
   */
  sanitizeAllInputs() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) return next();

      // Sanitize body
      if (req.body) {
        req.body = this.deepSanitize(req.body);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = this.deepSanitize(req.query);
      }

      // Sanitize URL parameters
      if (req.params) {
        req.params = this.deepSanitize(req.params);
      }

      next();
    };
  }

  /**
   * Deep sanitization of nested objects
   */
  private deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
      let sanitized = obj;
      
      // Detect and block malicious content
      if (this.detectXSS(sanitized)) {
        this.metrics.blockedXSSAttempts++;
        sanitized = this.escapeHTML(sanitized);
      }
      
      if (this.detectSQLInjection(sanitized)) {
        this.metrics.blockedSQLInjections++;
        sanitized = this.escapeSQLChars(sanitized);
      }

      return this.sanitizeString(sanitized);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.deepSanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Create custom validation rules for specific endpoints
   */
  createCustomValidator(rules: { [endpoint: string]: ValidationRule[] }) {
    return (req: Request, res: Response, next: NextFunction) => {
      const endpoint = req.route?.path || req.path;
      const endpointRules = rules[endpoint];

      if (!endpointRules || !this.config.enabled) {
        return next();
      }

      const errors = this.validateObject(req.body, endpointRules);
      
      if (errors.length > 0) {
        this.metrics.validationFailures++;
        return res.status(400).json({
          error: 'Validation failed',
          endpoint,
          details: errors
        });
      }

      req.body = this.sanitizeObject(req.body, endpointRules);
      next();
    };
  }

  /**
   * Get validation metrics
   */
  getMetrics(): ValidationMetrics {
    return {
      ...this.metrics,
      fieldValidationStats: new Map(this.metrics.fieldValidationStats)
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalValidations: 0,
      validationFailures: 0,
      sanitizedInputs: 0,
      blockedXSSAttempts: 0,
      blockedSQLInjections: 0,
      fieldValidationStats: new Map()
    };
  }

  /**
   * Health check for input validation service
   */
  healthCheck() {
    const metrics = this.getMetrics();
    let status = 'healthy';
    const recommendations: string[] = [];

    const failureRate = metrics.totalValidations > 0 ? 
      (metrics.validationFailures / metrics.totalValidations) * 100 : 0;

    if (failureRate > 20) {
      status = 'warning';
      recommendations.push('High validation failure rate. Review input data quality.');
    }

    if (metrics.blockedXSSAttempts > 10) {
      status = 'warning';
      recommendations.push('XSS attempts detected. Monitor for security threats.');
    }

    if (metrics.blockedSQLInjections > 5) {
      status = 'warning';
      recommendations.push('SQL injection attempts detected. Review database security.');
    }

    return {
      status,
      metrics: {
        ...metrics,
        failureRate: Math.round(failureRate * 100) / 100
      },
      recommendations,
      enabled: this.config.enabled
    };
  }

  /**
   * Add custom sanitization rule
   */
  addCustomSanitizer(name: string, sanitizer: (value: string) => string): void {
    // Store custom sanitizers for future use
    (this as any)[`sanitize_${name}`] = sanitizer;
  }

  /**
   * Validate and sanitize single value
   */
  validateSingle(value: any, rule: ValidationRule): { valid: boolean; sanitized: any; errors: string[] } {
    const errors = this.validateObject({ [rule.field]: value }, [rule]);
    const sanitized = this.sanitizeValue(value, rule);

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }
}

// Predefined validation rules for common use cases
export const commonValidationRules = {
  user: {
    register: [
      { field: 'email', type: 'email' as const, required: true, maxLength: 255 },
      { field: 'password', type: 'string' as const, required: true, minLength: 8, maxLength: 128 },
      { field: 'firstName', type: 'string' as const, required: true, minLength: 1, maxLength: 50 },
      { field: 'lastName', type: 'string' as const, required: true, minLength: 1, maxLength: 50 }
    ],
    login: [
      { field: 'email', type: 'email' as const, required: true },
      { field: 'password', type: 'string' as const, required: true }
    ],
    profile: [
      { field: 'firstName', type: 'string' as const, maxLength: 50 },
      { field: 'lastName', type: 'string' as const, maxLength: 50 },
      { field: 'bio', type: 'string' as const, maxLength: 500, allowHTML: true }
    ]
  },
  content: {
    create: [
      { field: 'title', type: 'string' as const, required: true, minLength: 1, maxLength: 200 },
      { field: 'content', type: 'string' as const, required: true, minLength: 1, allowHTML: true },
      { field: 'category', type: 'string' as const, required: true, enum: ['anxiety', 'depression', 'stress', 'wellness'] },
      { field: 'tags', type: 'array' as const }
    ]
  },
  chat: {
    message: [
      { field: 'message', type: 'string' as const, required: true, minLength: 1, maxLength: 2000 },
      { field: 'sessionId', type: 'string' as const, required: true }
    ]
  }
};

// Create singleton instance
export const inputValidationService = new InputValidationService({
  enabled: process.env.INPUT_VALIDATION_ENABLED !== 'false',
  allowedTags: (process.env.ALLOWED_HTML_TAGS || 'p,br,strong,em,u,ol,ul,li,blockquote').split(','),
  allowedAttributes: {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title'],
    'blockquote': ['cite']
  },
  removeEmptyTags: process.env.REMOVE_EMPTY_TAGS !== 'false',
  trimWhitespace: process.env.TRIM_WHITESPACE !== 'false',
  normalizeEmail: process.env.NORMALIZE_EMAIL !== 'false',
  escapeSQLChars: process.env.ESCAPE_SQL_CHARS !== 'false'
});