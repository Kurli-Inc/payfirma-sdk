/**
 * Common type definitions used across the Payfirma SDK
 */

/**
 * SDK Configuration options
 */
export interface PayfirmaSDKConfig {
  /** Client ID from your PayHQ account */
  clientId: string;
  /** Client Secret from your PayHQ account */
  clientSecret: string;
  /** Whether to use sandbox environment (default: false) */
  sandbox?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom API base URLs for advanced usage */
  apiUrls?: {
    auth?: string;
    gateway?: string;
  };
}

/**
 * HTTP methods supported by the API
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Currency codes supported by Payfirma
 */
export type Currency = 'CAD' | 'USD';

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  /** Number of items per page */
  limit?: number;
  /** Cursor for pagination - start of page */
  before?: string;
  /** Cursor for pagination - end of page */
  after?: string;
}

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of entities */
  entities: T[];
  /** Pagination metadata */
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data?: T;
  /** Error information if request failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers?: Record<string, string>;
}

/**
 * Address information
 */
export interface Address {
  /** First line of address */
  address1?: string;
  /** Second line of address */
  address2?: string;
  /** City */
  city?: string;
  /** Province/State */
  province?: string;
  /** Country (ISO 3166 Alpha 2 format) */
  country?: string;
  /** Postal code/ZIP code */
  postal_code?: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  /** First name */
  first_name?: string;
  /** Last name */
  last_name?: string;
  /** Email address */
  email?: string;
  /** Phone number */
  telephone?: string;
  /** Company name */
  company?: string;
}

/**
 * Generic lookup ID reference
 */
export interface LookupReference {
  /** Internal ID */
  id: number;
  /** Hashed lookup ID for API operations */
  lookup_id: string;
}

/**
 * Date range filter
 */
export interface DateRange {
  /** Start date (ISO 8601 format or Unix timestamp) */
  start_date?: string | number;
  /** End date (ISO 8601 format or Unix timestamp) */
  end_date?: string | number;
}

/**
 * API environment configuration
 */
export interface Environment {
  /** Authentication service base URL */
  authUrl: string;
  /** API Gateway base URL */
  gatewayUrl: string;
  /** Environment name */
  name: 'sandbox' | 'production';
}

/**
 * Request configuration for API calls
 */
export interface RequestConfig {
  /** HTTP method */
  method: HttpMethod;
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  data?: any;
  /** Request timeout */
  timeout?: number;
}

/**
 * API error details
 */
export interface ApiErrorDetails {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: any;
  /** Request ID for tracking */
  request_id?: string;
}
