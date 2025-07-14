/**
 * Main Payfirma SDK class that provides access to all services
 */

import { PayfirmaSDKConfig, Environment } from './types/common';
import { ConfigurationError } from './types/errors';
import {
  AuthService,
  CustomerService,
  PlanService,
  TransactionService,
  InvoiceService,
  TerminalService,
  EFTService,
} from './services';

/**
 * Main Payfirma SDK class
 *
 * @example
 * ```typescript
 * const sdk = new PayfirmaSDK({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   sandbox: true
 * });
 *
 * // Initialize authentication
 * await sdk.initialize();
 *
 * // Use the services
 * const customer = await sdk.customers.createCustomer({
 *   email: 'customer@example.com',
 *   first_name: 'John',
 *   last_name: 'Doe'
 * });
 * ```
 */
export class PayfirmaSDK {
  private config: PayfirmaSDKConfig;
  private environment: Environment;
  private authService: AuthService;
  private initialized = false;

  /** Authentication service */
  public readonly auth: AuthService;
  /** Customer management service */
  public readonly customers: CustomerService;
  /** Plan management service */
  public readonly plans: PlanService;
  /** Transaction processing service */
  public readonly transactions: TransactionService;
  /** Invoice management service */
  public readonly invoices: InvoiceService;
  /** Terminal service */
  public readonly terminals: TerminalService;
  /** EFT service */
  public readonly eft: EFTService;

  constructor(config: PayfirmaSDKConfig) {
    this.validateConfig(config);
    this.config = config;
    this.environment = this.getEnvironment(config.sandbox || false);

    // Initialize authentication service
    this.authService = new AuthService(this.config, this.environment);
    this.auth = this.authService;

    // Initialize all other services
    this.customers = new CustomerService(this.environment, this.authService);
    this.plans = new PlanService(this.environment, this.authService);
    this.transactions = new TransactionService(
      this.environment,
      this.authService
    );
    this.invoices = new InvoiceService(this.environment, this.authService);
    this.terminals = new TerminalService(this.environment, this.authService);
    this.eft = new EFTService(this.environment, this.authService);
  }

  /**
   * Initialize the SDK with authentication
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.authService.clientCredentialsGrant();
      this.initialized = true;
    } catch (error) {
      throw new ConfigurationError(
        'Failed to initialize SDK: Authentication failed',
        { originalError: error }
      );
    }
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current environment
   */
  getCurrentEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Get SDK configuration
   */
  getConfig(): PayfirmaSDKConfig {
    return { ...this.config };
  }

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<PayfirmaSDKConfig>): void {
    this.validateConfig({ ...this.config, ...newConfig });
    this.config = { ...this.config, ...newConfig };

    // Update environment if sandbox setting changed
    if (newConfig.sandbox !== undefined) {
      this.environment = this.getEnvironment(newConfig.sandbox);
    }
  }

  /**
   * Set custom credentials for partner integrations
   */
  setCredentials(
    accessToken: string,
    refreshToken?: string,
    expiresAt?: number
  ): void {
    const credentials: any = {
      access_token: accessToken,
      expires_at: expiresAt || Date.now() + 12 * 60 * 60 * 1000, // Default 12 hours
      scope: ['ecom', 'invoice', 'terminal', 'eft'],
    };

    if (refreshToken !== undefined) {
      credentials.refresh_token = refreshToken;
    }

    this.authService.setCredentials(credentials);
    this.initialized = true;
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(
    redirectUri: string,
    state?: string,
    scopes?: string[]
  ): string {
    return this.authService.getAuthorizationUrl(redirectUri, state, scopes);
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
    state?: string
  ): Promise<void> {
    await this.authService.authorizationCodeGrant(code, redirectUri, state);
    this.initialized = true;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    await this.authService.refreshToken();
  }

  /**
   * Revoke current token and reset SDK
   */
  async revoke(): Promise<void> {
    await this.authService.revokeToken();
    this.initialized = false;
  }

  /**
   * Get current authentication status
   */
  getAuthStatus(): {
    isAuthenticated: boolean;
    tokenValid: boolean;
    expiresAt?: number;
    needsRefresh?: boolean;
  } {
    const credentials = this.authService.getCredentials();
    if (!credentials) {
      return {
        isAuthenticated: false,
        tokenValid: false,
      };
    }

    const validation = this.authService.validateToken();
    const result: any = {
      isAuthenticated: true,
      tokenValid: validation.valid,
    };

    if (validation.expires_at !== undefined) {
      result.expiresAt = validation.expires_at;
    }

    if (validation.needs_refresh !== undefined) {
      result.needsRefresh = validation.needs_refresh;
    }

    return result;
  }

  /**
   * Validate SDK configuration
   */
  private validateConfig(config: PayfirmaSDKConfig): void {
    if (!config.clientId) {
      throw new ConfigurationError('Client ID is required');
    }

    if (!config.clientSecret) {
      throw new ConfigurationError('Client Secret is required');
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
      throw new ConfigurationError(
        'Timeout must be between 1000ms and 300000ms'
      );
    }
  }

  /**
   * Get environment configuration
   */
  private getEnvironment(sandbox: boolean): Environment {
    if (sandbox) {
      return {
        authUrl:
          this.config.apiUrls?.auth || 'https://sandbox-auth.payfirma.com',
        gatewayUrl:
          this.config.apiUrls?.gateway ||
          'https://sandbox-apigateway.payfirma.com',
        name: 'sandbox',
      };
    }

    return {
      authUrl: this.config.apiUrls?.auth || 'https://auth.payfirma.com',
      gatewayUrl:
        this.config.apiUrls?.gateway || 'https://apigateway.payfirma.com',
      name: 'production',
    };
  }

  /**
   * Create a new SDK instance with different configuration
   */
  static create(config: PayfirmaSDKConfig): PayfirmaSDK {
    return new PayfirmaSDK(config);
  }

  /**
   * Create a sandbox SDK instance
   */
  static createSandbox(clientId: string, clientSecret: string): PayfirmaSDK {
    return new PayfirmaSDK({
      clientId,
      clientSecret,
      sandbox: true,
    });
  }

  /**
   * Create a production SDK instance
   */
  static createProduction(clientId: string, clientSecret: string): PayfirmaSDK {
    return new PayfirmaSDK({
      clientId,
      clientSecret,
      sandbox: false,
    });
  }
}
