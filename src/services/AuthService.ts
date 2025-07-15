/**
 * Authentication service for managing OAuth 2.0 tokens
 */

import { HttpClient } from '../utils/apiClient';
import {
  TokenResponse,
  ClientCredentialsRequest,
  AuthorizationCodeRequest,
  RefreshTokenRequest,
  AuthCredentials,
  TokenValidation,
  JWTPayload,
} from '../types/auth';
import { PayfirmaSDKConfig, Environment } from '../types/common';
import {
  AuthenticationError,
  ErrorFactory,
  PayfirmaError,
} from '../types/errors';
import { createAuthClient } from '../utils/apiClient';

/**
 * Authentication service for OAuth 2.0 flow
 */
export class AuthService {
  private config: PayfirmaSDKConfig;
  private environment: Environment;
  private httpClient: HttpClient;
  private credentials: AuthCredentials | null = null;
  private tokenRefreshPromise: Promise<AuthCredentials> | null = null;

  constructor(config: PayfirmaSDKConfig, environment: Environment) {
    this.config = config;
    this.environment = environment;

    this.httpClient = createAuthClient(config, environment);
  }

  /**
   * Generate Basic Auth header for client credentials
   */
  private getBasicAuthHeader(): string {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Client credentials grant - get access token for your own account
   */
  async clientCredentialsGrant(): Promise<AuthCredentials> {
    const request: ClientCredentialsRequest = {
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    };

    try {
      const response = await this.httpClient.post<TokenResponse>(
        '/oauth/token',
        new URLSearchParams(request as any).toString(),
        {
          headers: {
            Authorization: this.getBasicAuthHeader(),
          },
        }
      );

      const tokenData = response.data;
      const credentials: AuthCredentials = {
        access_token: tokenData.access_token,
        expires_at: Date.now() + tokenData.expires_in * 1000,
        ...(tokenData.refresh_token && {
          refresh_token: tokenData.refresh_token,
        }),
        ...(tokenData.merchant_id && { merchant_id: tokenData.merchant_id }),
        ...(tokenData.scope && { scope: tokenData.scope.split(' ') }),
      };

      this.credentials = credentials;
      return credentials;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Authorization code grant - exchange authorization code for access token
   */
  async authorizationCodeGrant(
    code: string,
    redirectUri: string,
    state?: string
  ): Promise<AuthCredentials> {
    const request: AuthorizationCodeRequest = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      ...(state && { state }),
    };

    try {
      const response = await this.httpClient.post<TokenResponse>(
        '/oauth/token',
        new URLSearchParams(request as any).toString(),
        {
          headers: {
            Authorization: this.getBasicAuthHeader(),
          },
        }
      );

      const tokenData = response.data;
      const credentials: AuthCredentials = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Date.now() + tokenData.expires_in * 1000,
        merchant_id: tokenData.merchant_id,
        scope: tokenData.scope ? tokenData.scope.split(' ') : undefined,
      };

      this.credentials = credentials;
      return credentials;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh token grant - get new access token using refresh token
   */
  async refreshToken(refreshToken?: string): Promise<AuthCredentials> {
    // If a refresh is already in progress, return that promise
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    const tokenToUse = refreshToken || this.credentials?.refresh_token;
    if (!tokenToUse) {
      throw new AuthenticationError('No refresh token available');
    }

    const request: RefreshTokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: tokenToUse,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    };

    this.tokenRefreshPromise = (async () => {
      try {
        const response = await this.httpClient.post<TokenResponse>(
          '/oauth/token',
          new URLSearchParams(request as any).toString(),
          {
            headers: {
              Authorization: this.getBasicAuthHeader(),
            },
          }
        );

        const tokenData = response.data;
        const credentials: AuthCredentials = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + tokenData.expires_in * 1000,
          merchant_id: tokenData.merchant_id,
          scope: tokenData.scope ? tokenData.scope.split(' ') : undefined,
        };

        this.credentials = credentials;
        return credentials;
      } catch (error: any) {
        throw this.handleAuthError(error);
      } finally {
        this.tokenRefreshPromise = null;
      }
    })();

    return this.tokenRefreshPromise;
  }

  /**
   * Get the authorization URL for OAuth 2.0 flow
   */
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    scopes?: string[]
  ): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
    });

    if (state) {
      params.append('state', state);
    }

    if (scopes && scopes.length > 0) {
      params.append('scope', scopes.join(' '));
    }

    return `${this.environment.authUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Revoke the current access token
   */
  async revokeToken(): Promise<void> {
    if (!this.credentials) {
      return;
    }

    try {
      await this.httpClient.delete('/oauth/revoke_token', {
        headers: {
          Authorization: `Bearer ${this.credentials.access_token}`,
        },
      });
    } catch (error: any) {
      // Ignore errors when revoking token
    } finally {
      this.credentials = null;
    }
  }

  /**
   * Get current credentials
   */
  getCredentials(): AuthCredentials | null {
    return this.credentials;
  }

  /**
   * Set credentials (useful for restoring from storage)
   */
  setCredentials(credentials: AuthCredentials): void {
    this.credentials = credentials;
  }

  /**
   * Validate current token
   */
  validateToken(): TokenValidation {
    if (!this.credentials) {
      return {
        valid: false,
        reason: 'No credentials available',
      };
    }

    const now = Date.now();
    const expiresAt = this.credentials.expires_at;
    const timeToExpiry = expiresAt - now;

    // Consider token expired if it expires in less than 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (timeToExpiry <= bufferTime) {
      return {
        valid: false,
        expires_at: expiresAt,
        reason: 'Token expired or expiring soon',
        needs_refresh: !!this.credentials.refresh_token,
      };
    }

    return {
      valid: true,
      expires_at: expiresAt,
    };
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    const validation = this.validateToken();

    if (!validation.valid) {
      if (validation.needs_refresh) {
        await this.refreshToken();
      } else {
        throw new AuthenticationError(
          'No valid token available and cannot refresh'
        );
      }
    }

    return this.credentials!.access_token;
  }

  /**
   * Get Bearer authorization header
   */
  async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await this.getValidToken();
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Parse JWT token payload (without verification)
   */
  parseTokenPayload(token: string): JWTPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      return payload;
    } catch (error: any) {
      throw new AuthenticationError('Invalid token format', {
        originalError: error.message,
      });
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): PayfirmaError {
    if (error.response) {
      const { status, data } = error.response;

      if (data?.error) {
        return ErrorFactory.fromApiResponse(
          {
            code: data.error,
            message: data.error_description || 'Authentication failed',
            status,
            details: data,
            request_id: error.response.headers['x-request-id'],
          },
          error
        );
      }

      return new AuthenticationError(
        `Authentication failed: ${status}`,
        { status, response: data },
        error.response.headers['x-request-id'],
        error
      );
    }

    if (error.request) {
      return ErrorFactory.networkError(
        'Network error during authentication',
        error
      );
    }

    return new AuthenticationError(
      'Authentication failed',
      { originalError: error.message },
      undefined,
      error
    );
  }
}
