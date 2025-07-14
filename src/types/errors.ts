/**
 * Error type definitions for the Payfirma SDK
 */

/**
 * Error codes used throughout the SDK
 */
export enum PayfirmaErrorCode {
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INSUFFICIENT_SCOPE = 'INSUFFICIENT_SCOPE',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  REQUEST_FAILED = 'REQUEST_FAILED',
  
  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  INVALID_CARD_NUMBER = 'INVALID_CARD_NUMBER',
  INVALID_EXPIRY_DATE = 'INVALID_EXPIRY_DATE',
  INVALID_CVV = 'INVALID_CVV',
  
  // Business logic errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  CARD_DECLINED = 'CARD_DECLINED',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  
  // Payment processing errors
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  REFUND_FAILED = 'REFUND_FAILED',
  CAPTURE_FAILED = 'CAPTURE_FAILED',
  
  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  SANDBOX_ONLY = 'SANDBOX_ONLY',
  PRODUCTION_ONLY = 'PRODUCTION_ONLY',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base error class for all Payfirma SDK errors
 */
export class PayfirmaError extends Error {
  /** Error code */
  public readonly code: PayfirmaErrorCode;
  /** HTTP status code if applicable */
  public readonly statusCode: number | undefined;
  /** Additional error details */
  public readonly details: any;
  /** Request ID for tracking */
  public readonly requestId: string | undefined;
  /** Original error that caused this error */
  public readonly cause: Error | undefined;

  constructor(
    message: string,
    code: PayfirmaErrorCode = PayfirmaErrorCode.UNKNOWN_ERROR,
    statusCode?: number,
    details?: any,
    requestId?: string,
    cause?: Error
  ) {
    super(message);
    this.name = 'PayfirmaError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
    this.cause = cause;
    
    // Maintains proper stack trace for where our error was thrown (Node.js only)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, PayfirmaError);
    }
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends PayfirmaError {
  constructor(message: string, details?: any, requestId?: string, cause?: Error) {
    super(message, PayfirmaErrorCode.AUTHENTICATION_FAILED, 401, details, requestId, cause);
    this.name = 'AuthenticationError';
  }
}

/**
 * Network related errors
 */
export class NetworkError extends PayfirmaError {
  constructor(message: string, cause?: Error, requestId?: string) {
    super(message, PayfirmaErrorCode.NETWORK_ERROR, undefined, undefined, requestId, cause);
    this.name = 'NetworkError';
  }
}

/**
 * API related errors
 */
export class ApiError extends PayfirmaError {
  constructor(
    message: string,
    statusCode: number,
    code: PayfirmaErrorCode = PayfirmaErrorCode.API_ERROR,
    details?: any,
    requestId?: string
  ) {
    super(message, code, statusCode, details, requestId);
    this.name = 'ApiError';
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends PayfirmaError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, PayfirmaErrorCode.VALIDATION_ERROR, 400, details, requestId);
    this.name = 'ValidationError';
  }
}

/**
 * Payment processing errors
 */
export class PaymentError extends PayfirmaError {
  constructor(
    message: string,
    code: PayfirmaErrorCode = PayfirmaErrorCode.PAYMENT_FAILED,
    details?: any,
    requestId?: string
  ) {
    super(message, code, 402, details, requestId);
    this.name = 'PaymentError';
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends PayfirmaError {
  constructor(message: string, resourceType: string, requestId?: string) {
    super(message, PayfirmaErrorCode.TRANSACTION_NOT_FOUND, 404, { resourceType }, requestId);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends PayfirmaError {
  /** When the rate limit resets */
  public readonly resetAt: Date | undefined;
  /** Number of requests remaining */
  public readonly remaining: number | undefined;
  /** Rate limit window */
  public readonly window: number | undefined;

  constructor(
    message: string,
    resetAt?: Date,
    remaining?: number,
    window?: number,
    requestId?: string
  ) {
    super(message, PayfirmaErrorCode.RATE_LIMIT_EXCEEDED, 429, {
      resetAt,
      remaining,
      window,
    }, requestId);
    this.name = 'RateLimitError';
    this.resetAt = resetAt;
    this.remaining = remaining;
    this.window = window;
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends PayfirmaError {
  constructor(message: string, details?: any) {
    super(message, PayfirmaErrorCode.INVALID_CONFIGURATION, undefined, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error response from the API
 */
export interface ErrorResponse {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: any;
  /** Request ID */
  request_id?: string;
  /** Timestamp */
  timestamp?: string;
}

/**
 * Error factory for creating appropriate error instances
 */
export class ErrorFactory {
  /**
   * Create an error from an API response
   */
  static fromApiResponse(response: ErrorResponse, cause?: Error): PayfirmaError {
    const { code, message, status, details, request_id } = response;
    
    // Map API error codes to our error types
    switch (code) {
      case 'AUTHENTICATION_FAILED':
      case 'TOKEN_EXPIRED':
      case 'INVALID_CREDENTIALS':
        return new AuthenticationError(message, details, request_id, cause);
      
      case 'VALIDATION_ERROR':
      case 'REQUIRED_FIELD_MISSING':
      case 'INVALID_FORMAT':
        return new ValidationError(message, details, request_id);
      
      case 'PAYMENT_DECLINED':
      case 'PAYMENT_FAILED':
      case 'CARD_DECLINED':
        return new PaymentError(message, code as PayfirmaErrorCode, details, request_id);
      
      case 'RATE_LIMIT_EXCEEDED':
        return new RateLimitError(message, undefined, undefined, undefined, request_id);
      
      case 'TRANSACTION_NOT_FOUND':
      case 'CUSTOMER_NOT_FOUND':
      case 'PLAN_NOT_FOUND':
      case 'INVOICE_NOT_FOUND':
        return new NotFoundError(message, code.replace('_NOT_FOUND', ''), request_id);
      
      default:
        return new ApiError(message, status || 500, code as PayfirmaErrorCode, details, request_id);
    }
  }
  
  /**
   * Create a network error
   */
  static networkError(message: string, cause?: Error): NetworkError {
    return new NetworkError(message, cause);
  }
  
  /**
   * Create a configuration error
   */
  static configurationError(message: string, details?: any): ConfigurationError {
    return new ConfigurationError(message, details);
  }
} 