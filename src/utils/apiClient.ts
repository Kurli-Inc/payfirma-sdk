import { PayfirmaSDKConfig, Environment } from '../types/common';
import { transformKeysToSnake, transformKeysToCamel } from './transformers';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  transformRequest?: boolean;
  transformResponse?: boolean;
}

/**
 * HTTP client class that wraps fetch with axios-like interface
 */
export class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(options: {
    method: string;
    url: string;
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  }): Promise<{ data: T; status: number; statusText: string }> {
    const { method, url, data, headers = {}, params } = options;

    // Build full URL
    let fullUrl = this.config.baseURL + url;

    // Add query parameters
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Prepare request body
    let body: string | FormData | undefined;
    const requestHeaders = { ...this.config.headers, ...headers };

    if (data) {
      if (
        requestHeaders['Content-Type'] === 'application/x-www-form-urlencoded'
      ) {
        // For form data (auth endpoints)
        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        body = formData.toString();
      } else {
        // For JSON data - apply transformers if enabled
        const transformedData = this.config.transformRequest
          ? transformKeysToSnake(data)
          : data;
        body = JSON.stringify(transformedData);
      }
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let responseData: any;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();

        // Apply response transformers if enabled
        if (this.config.transformResponse) {
          responseData = transformKeysToCamel(responseData);
        }
      } else {
        responseData = await response.text();
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: { params?: Record<string, any>; headers?: Record<string, string> }
  ) {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: { headers?: Record<string, string> }
  ) {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: { headers?: Record<string, string> }
  ) {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: { headers?: Record<string, string> }
  ) {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }
}

/**
 * Create a configured HTTP client with camelCase transformers
 */
export function createApiClient(
  config: PayfirmaSDKConfig,
  environment: Environment,
  baseURL?: string
): HttpClient {
  return new HttpClient({
    baseURL: baseURL || environment.gatewayUrl,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Payfirma-SDK-TypeScript/1.0.0',
    },
    transformRequest: true,
    transformResponse: true,
  });
}

/**
 * Create a configured HTTP client for auth endpoints (no JSON transformers)
 */
export function createAuthClient(
  config: PayfirmaSDKConfig,
  environment: Environment
): HttpClient {
  return new HttpClient({
    baseURL: environment.authUrl,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Payfirma-SDK-TypeScript/1.0.0',
    },
    transformRequest: false,
    transformResponse: false,
  });
}

/**
 * Add authorization header to request config
 */
export function withAuth(
  config: { headers?: Record<string, string> } = {},
  token: string
): { headers: Record<string, string> } {
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}
