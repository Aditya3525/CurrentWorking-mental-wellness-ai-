/**
 * Base Application Error
 * 
 * All custom errors extend this base class for consistent error handling.
 */

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.constructor.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity (Validation Error)
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(
    errors: Record<string, string[]> | string,
    message: string = 'Validation failed'
  ) {
    super(message, 422);
    this.errors = typeof errors === 'string' ? { general: [errors] } : errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
  }
}

/**
 * Domain-Specific Errors
 */

export class UserNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super(identifier ? `User with ${identifier}` : 'User');
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password');
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Token has expired');
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('Invalid token');
  }
}

export class AssessmentNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(id ? `Assessment ${id}` : 'Assessment');
  }
}

export class ChatSessionNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(id ? `Chat session ${id}` : 'Chat session');
  }
}

export class PlanNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(id ? `Plan ${id}` : 'Plan');
  }
}

export class ContentNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(id ? `Content ${id}` : 'Content');
  }
}

export class AIProviderError extends AppError {
  constructor(provider: string, message: string) {
    super(`AI Provider (${provider}) error: ${message}`, 502);
  }
}

export class DatabaseError extends InternalServerError {
  constructor(operation: string, details?: string) {
    super(`Database ${operation} failed${details ? `: ${details}` : ''}`);
  }
}

export class CacheError extends InternalServerError {
  constructor(operation: string, details?: string) {
    super(`Cache ${operation} failed${details ? `: ${details}` : ''}`);
  }
}

/**
 * Rate Limiting Error
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      `Too many requests. ${retryAfter ? `Please retry after ${retryAfter} seconds.` : 'Please try again later.'}`,
      429
    );
  }
}

/**
 * File Upload Errors
 */
export class FileUploadError extends BadRequestError {
  constructor(reason: string) {
    super(`File upload failed: ${reason}`);
  }
}

export class FileSizeLimitError extends FileUploadError {
  constructor(maxSize: string) {
    super(`File size exceeds maximum limit of ${maxSize}`);
  }
}

export class UnsupportedFileTypeError extends FileUploadError {
  constructor(fileType: string, allowedTypes: string[]) {
    super(`File type ${fileType} not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }
}

/**
 * Assessment-specific errors
 */
export class InvalidAssessmentResponseError extends ValidationError {
  constructor(details: string) {
    super({ responses: [details] }, 'Invalid assessment response');
  }
}

export class AssessmentSessionExpiredError extends BadRequestError {
  constructor() {
    super('Assessment session has expired. Please start a new session.');
  }
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Helper to create error responses
 */
export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  timestamp: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export function createErrorResponse(
  error: AppError | Error,
  includeStack: boolean = false
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: error.message,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ValidationError) {
    response.errors = error.errors;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
}
