/**
 * Terminal service for card terminal integration
 */

import { HttpClient, createApiClient, withAuth } from '../utils/apiClient';
import { AuthService } from './AuthService';
import { Environment } from '../types/common';
import {
  TerminalTransaction,
  TerminalSaleRequest,
  TerminalSaleWithCustomerRequest,
  TerminalRefundRequest,
  TerminalAuthorizationRequest,
  TerminalCaptureRequest,
  TerminalConfig,
} from '../types/terminal';
import { ErrorFactory, PayfirmaError } from '../types/errors';

/**
 * Terminal service for card terminal integration
 */
export class TerminalService {
  private httpClient: HttpClient;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = createApiClient(
      { clientId: '', clientSecret: '', timeout: 30000 },
      environment,
      `${environment.gatewayUrl}/terminal-service`
    );
  }

  /**
   * Helper method to make authenticated HTTP requests
   */
  private async makeAuthenticatedRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: any
  ): Promise<{ data: T; status: number; statusText: string }> {
    try {
      const authHeader = await this.authService.getAuthHeader();
      const authConfig = withAuth(
        config || {},
        authHeader.Authorization.replace('Bearer ', '')
      );

      switch (method) {
        case 'get':
          return await this.httpClient.get<T>(url, authConfig);
        case 'post':
          return await this.httpClient.post<T>(url, data, authConfig);
        case 'put':
          return await this.httpClient.put<T>(url, data, authConfig);
        case 'delete':
          return await this.httpClient.delete<T>(url, authConfig);
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Process a sale using customer lookup
   */
  async saleWithCustomer(
    request: TerminalSaleWithCustomerRequest
  ): Promise<TerminalTransaction> {
    const response = await this.makeAuthenticatedRequest<TerminalTransaction>(
      'post',
      '/sale/customer',
      request
    );
    return response.data;
  }

  /**
   * Process a sale without customer lookup
   */
  async sale(request: TerminalSaleRequest): Promise<TerminalTransaction> {
    const response = await this.makeAuthenticatedRequest<TerminalTransaction>(
      'post',
      '/sale',
      request
    );
    return response.data;
  }

  /**
   * Process a refund
   */
  async refund(request: TerminalRefundRequest): Promise<TerminalTransaction> {
    const response = await this.makeAuthenticatedRequest<TerminalTransaction>(
      'post',
      '/refund',
      request
    );
    return response.data;
  }

  /**
   * Authorize a card (hold funds)
   */
  async authorize(
    request: TerminalAuthorizationRequest
  ): Promise<TerminalTransaction> {
    const response = await this.makeAuthenticatedRequest<TerminalTransaction>(
      'post',
      '/authorize',
      request
    );
    return response.data;
  }

  /**
   * Capture a previous authorization
   */
  async capture(
    transactionId: string,
    request: TerminalCaptureRequest
  ): Promise<TerminalTransaction> {
    const response = await this.makeAuthenticatedRequest<TerminalTransaction>(
      'post',
      `/capture/${transactionId}`,
      request
    );
    return response.data;
  }

  /**
   * Get terminal transaction details
   */
  async getTransaction(transactionId: string): Promise<TerminalTransaction> {
    const response = await this.makeAuthenticatedRequest<TerminalTransaction>(
      'get',
      `/transaction/${transactionId}`
    );
    return response.data;
  }

  /**
   * Get terminal configuration
   */
  async getTerminalConfig(terminalId: string): Promise<TerminalConfig> {
    const response = await this.makeAuthenticatedRequest<TerminalConfig>(
      'get',
      `/terminal/${terminalId}/config`
    );
    return response.data;
  }

  /**
   * Update terminal configuration
   */
  async updateTerminalConfig(
    terminalId: string,
    config: Partial<TerminalConfig>
  ): Promise<TerminalConfig> {
    const response = await this.makeAuthenticatedRequest<TerminalConfig>(
      'put',
      `/terminal/${terminalId}/config`,
      config
    );
    return response.data;
  }

  /**
   * Get terminal status
   */
  async getTerminalStatus(terminalId: string): Promise<{
    terminal_id: string;
    status: string;
    last_activity: string;
    is_online: boolean;
  }> {
    const response = await this.httpClient.get(
      `/terminal/${terminalId}/status`
    );
    return response.data;
  }

  /**
   * List all terminals
   */
  async listTerminals(): Promise<TerminalConfig[]> {
    const response = await this.makeAuthenticatedRequest<TerminalConfig[]>(
      'get',
      '/terminals'
    );
    return response.data;
  }

  /**
   * Quick sale for a specific terminal
   */
  async quickSale(
    terminalId: string,
    amount: number,
    currency: string = 'CAD'
  ): Promise<TerminalTransaction> {
    return this.sale({
      terminal_id: terminalId,
      amount,
      currency: currency as any,
    });
  }

  /**
   * Quick refund for a specific terminal
   */
  async quickRefund(
    terminalId: string,
    originalTransactionId: string,
    amount: number
  ): Promise<TerminalTransaction> {
    return this.refund({
      terminal_id: terminalId,
      original_transaction_id: originalTransactionId,
      amount,
    });
  }

  /**
   * Get terminal transactions for a specific date
   */
  async getTerminalTransactions(
    terminalId: string,
    date?: string
  ): Promise<TerminalTransaction[]> {
    const params = date ? { date } : {};
    const response = await this.makeAuthenticatedRequest<TerminalTransaction[]>(
      'get',
      `/terminal/${terminalId}/transactions`,
      undefined,
      { params }
    );
    return response.data;
  }

  /**
   * Get terminal daily totals
   */
  async getTerminalDailyTotals(
    terminalId: string,
    date?: string
  ): Promise<{
    date: string;
    terminal_id: string;
    transaction_count: number;
    sales_count: number;
    refunds_count: number;
    total_amount: number;
    sales_amount: number;
    refunds_amount: number;
    currency: string;
  }> {
    const params = date ? { date } : {};
    const response = await this.httpClient.get(
      `/terminal/${terminalId}/daily-totals`,
      { params }
    );
    return response.data;
  }

  /**
   * Check if terminal is online
   */
  async isTerminalOnline(terminalId: string): Promise<boolean> {
    try {
      const status = await this.getTerminalStatus(terminalId);
      return status.is_online;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Get all online terminals
   */
  async getOnlineTerminals(): Promise<TerminalConfig[]> {
    const terminals = await this.listTerminals();
    const onlineTerminals: TerminalConfig[] = [];

    for (const terminal of terminals) {
      if (await this.isTerminalOnline(terminal.terminal_id)) {
        onlineTerminals.push(terminal);
      }
    }

    return onlineTerminals;
  }

  /**
   * Check if terminal exists
   */
  async terminalExists(terminalId: string): Promise<boolean> {
    try {
      await this.getTerminalConfig(terminalId);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): PayfirmaError {
    if (error.response) {
      const { status, data } = error.response;

      if (data?.error) {
        return ErrorFactory.fromApiResponse(
          {
            code: data.error,
            message: data.message || 'Terminal service error',
            status,
            details: data,
            request_id: error.response.headers['x-request-id'],
          },
          error
        );
      }

      return ErrorFactory.fromApiResponse(
        {
          code: 'API_ERROR',
          message: `Terminal service error: ${status}`,
          status,
          details: data,
          request_id: error.response.headers['x-request-id'],
        },
        error
      );
    }

    if (error.request) {
      return ErrorFactory.networkError(
        'Network error in terminal service',
        error
      );
    }

    return ErrorFactory.fromApiResponse(
      {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error in terminal service',
      },
      error
    );
  }
}
