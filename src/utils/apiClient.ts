import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PayfirmaSDKConfig, Environment } from '../types/common';
import { requestTransformer, responseTransformer } from './transformers';

/**
 * Create a configured axios instance with camelCase transformers
 */
export function createApiClient(
  config: PayfirmaSDKConfig,
  environment: Environment,
  baseURL?: string
): AxiosInstance {
  return axios.create({
    baseURL: baseURL || environment.gatewayUrl,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Payfirma-SDK-TypeScript/1.0.0',
    },
    transformRequest: [
      requestTransformer,
      ...(axios.defaults.transformRequest as any[]),
    ],
    transformResponse: [
      ...(axios.defaults.transformResponse as any[]),
      responseTransformer,
    ],
  });
}

/**
 * Create a configured axios instance for auth endpoints (no JSON transformers)
 */
export function createAuthClient(
  config: PayfirmaSDKConfig,
  environment: Environment
): AxiosInstance {
  return axios.create({
    baseURL: environment.authUrl,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Payfirma-SDK-TypeScript/1.0.0',
    },
  });
}

/**
 * Add authorization header to request config
 */
export function withAuth(
  config: AxiosRequestConfig,
  token: string
): AxiosRequestConfig {
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}
