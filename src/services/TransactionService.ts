/**
 * Transaction service for payment processing
 */

import axios, { AxiosInstance } from 'axios';
import { AuthService } from './AuthService';
import { Environment } from '../types/common';
import {
  Transaction,
  SaleTransactionRequest,
  AuthorizationTransactionRequest,
  CaptureTransactionRequest,
  RefundTransactionRequest,
  TransactionSearchParams,
  TransactionListResponse,
  TransactionSummary,
} from '../types/transaction';
import { ErrorFactory, PayfirmaError } from '../types/errors';

/**
 * Transaction service for payment processing
 */
export class TransactionService {
  private httpClient: AxiosInstance;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = axios.create({
      baseURL: `${environment.gatewayUrl}/transaction-service`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Payfirma-SDK-TypeScript/1.0.0',
      },
    });

    // Add request interceptor to include auth header
    this.httpClient.interceptors.request.use(async config => {
      const authHeader = await this.authService.getAuthHeader();
      if (config.headers) {
        config.headers['Authorization'] = authHeader.Authorization;
      }
      return config;
    });

    // Add response interceptor to handle errors
    this.httpClient.interceptors.response.use(
      response => response,
      error => {
        throw this.handleError(error);
      }
    );
  }

  // Payment Processing

  /**
   * Process a sale transaction
   */
  async createSale(request: SaleTransactionRequest): Promise<Transaction> {
    const response = await this.httpClient.post<Transaction>('/sale', request);
    return response.data;
  }

  /**
   * Create an authorization (hold funds without capturing)
   */
  async createAuthorization(
    request: AuthorizationTransactionRequest
  ): Promise<Transaction> {
    const response = await this.httpClient.post<Transaction>(
      '/authorize',
      request
    );
    return response.data;
  }

  /**
   * Capture a previously authorized transaction
   */
  async captureTransaction(
    transactionId: string,
    request: CaptureTransactionRequest
  ): Promise<Transaction> {
    const response = await this.httpClient.post<Transaction>(
      `/capture/${transactionId}`,
      request
    );
    return response.data;
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(
    transactionId: string,
    request: RefundTransactionRequest
  ): Promise<Transaction> {
    const response = await this.httpClient.post<Transaction>(
      `/refund/${transactionId}`,
      request
    );
    return response.data;
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await this.httpClient.get<Transaction>(
      `/transaction/${transactionId}`
    );
    return response.data;
  }

  /**
   * List transactions with filtering
   */
  async listTransactions(
    params?: TransactionSearchParams
  ): Promise<TransactionListResponse> {
    const response = await this.httpClient.get<TransactionListResponse>(
      '/transaction',
      { params }
    );
    return response.data;
  }

  // Convenience Methods

  /**
   * Quick sale with card details
   */
  async quickSale(
    amount: number,
    cardNumber: string,
    expiryMonth: number,
    expiryYear: number,
    cvv: string,
    currency: string = 'CAD'
  ): Promise<Transaction> {
    return this.createSale({
      amount,
      currency: currency as any,
      card: {
        card_number: cardNumber,
        card_expiry_month: expiryMonth,
        card_expiry_year: expiryYear,
        cvv2: cvv,
      },
    });
  }

  /**
   * Sale with encrypted token
   */
  async saleWithToken(
    amount: number,
    token: string,
    currency: string = 'CAD'
  ): Promise<Transaction> {
    return this.createSale({
      amount,
      currency: currency as any,
      token,
    });
  }

  /**
   * Sale with stored customer card
   */
  async saleWithCustomer(
    amount: number,
    customerLookupId: string,
    currency: string = 'CAD',
    cardLookupId?: string
  ): Promise<Transaction> {
    const request: SaleTransactionRequest = {
      amount,
      currency: currency as any,
      customer_lookup_id: customerLookupId,
    };

    if (cardLookupId) {
      request.card_lookup_id = cardLookupId;
    }

    return this.createSale(request);
  }

  /**
   * Quick authorization with card details
   */
  async quickAuthorization(
    amount: number,
    cardNumber: string,
    expiryMonth: number,
    expiryYear: number,
    cvv: string,
    currency: string = 'CAD'
  ): Promise<Transaction> {
    return this.createAuthorization({
      amount,
      currency: currency as any,
      card: {
        card_number: cardNumber,
        card_expiry_month: expiryMonth,
        card_expiry_year: expiryYear,
        cvv2: cvv,
      },
    });
  }

  /**
   * Full refund
   */
  async fullRefund(transactionId: string): Promise<Transaction> {
    // First get the transaction to get the full amount
    const transaction = await this.getTransaction(transactionId);
    return this.refundTransaction(transactionId, {
      amount: transaction.amount,
    });
  }

  /**
   * Partial refund
   */
  async partialRefund(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<Transaction> {
    const request: RefundTransactionRequest = {
      amount,
    };

    if (reason !== undefined) {
      request.reason = reason;
    }

    return this.refundTransaction(transactionId, request);
  }

  /**
   * Capture full authorization
   */
  async captureFullAmount(transactionId: string): Promise<Transaction> {
    // First get the transaction to get the full amount
    const transaction = await this.getTransaction(transactionId);
    return this.captureTransaction(transactionId, {
      amount: transaction.amount,
    });
  }

  /**
   * Capture partial authorization
   */
  async capturePartialAmount(
    transactionId: string,
    amount: number
  ): Promise<Transaction> {
    return this.captureTransaction(transactionId, {
      amount,
    });
  }

  // Search and Filter Methods

  /**
   * Get transactions by status
   */
  async getTransactionsByStatus(status: string): Promise<Transaction[]> {
    const response = await this.listTransactions({ status: status as any });
    return response.entities;
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(
    startDate: string | number,
    endDate: string | number
  ): Promise<Transaction[]> {
    const response = await this.listTransactions({
      start_date: startDate,
      end_date: endDate,
    });
    return response.entities;
  }

  /**
   * Get transactions by amount range
   */
  async getTransactionsByAmountRange(
    minAmount: number,
    maxAmount: number
  ): Promise<Transaction[]> {
    const response = await this.listTransactions({
      amount_min: minAmount,
      amount_max: maxAmount,
    });
    return response.entities;
  }

  /**
   * Get transactions by customer email
   */
  async getTransactionsByCustomerEmail(email: string): Promise<Transaction[]> {
    const response = await this.listTransactions({
      customer_email: email,
    });
    return response.entities;
  }

  /**
   * Search transactions by order ID
   */
  async getTransactionsByOrderId(orderId: string): Promise<Transaction[]> {
    const response = await this.listTransactions({
      order_id: orderId,
    });
    return response.entities;
  }

  /**
   * Get approved transactions
   */
  async getApprovedTransactions(): Promise<Transaction[]> {
    return this.getTransactionsByStatus('APPROVED');
  }

  /**
   * Get declined transactions
   */
  async getDeclinedTransactions(): Promise<Transaction[]> {
    return this.getTransactionsByStatus('DECLINED');
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<Transaction[]> {
    return this.getTransactionsByStatus('PENDING');
  }

  /**
   * Get refunded transactions
   */
  async getRefundedTransactions(): Promise<Transaction[]> {
    const response = await this.listTransactions({ type: 'REFUND' });
    return response.entities;
  }

  // Reporting and Analytics

  /**
   * Get transaction summary
   */
  async getTransactionSummary(
    params?: TransactionSearchParams
  ): Promise<TransactionSummary> {
    const response = await this.listTransactions(params);
    const transactions = response.entities;

    const summary: TransactionSummary = {
      total_count: transactions.length,
      total_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
      total_fees: transactions.reduce((sum, t) => sum + (t.fee_amount || 0), 0),
      net_amount: transactions.reduce(
        (sum, t) => sum + (t.net_amount || t.amount),
        0
      ),
      currency: transactions[0]?.currency || 'CAD',
      status_breakdown: {
        approved: transactions.filter(t => t.status === 'APPROVED').length,
        declined: transactions.filter(t => t.status === 'DECLINED').length,
        pending: transactions.filter(t => t.status === 'PENDING').length,
        cancelled: transactions.filter(t => t.status === 'CANCELLED').length,
        failed: transactions.filter(t => t.status === 'FAILED').length,
      },
      type_breakdown: {
        sales: transactions.filter(t => t.type === 'SALE').length,
        authorizations: transactions.filter(t => t.type === 'AUTHORIZATION')
          .length,
        captures: transactions.filter(t => t.type === 'CAPTURE').length,
        refunds: transactions.filter(t => t.type === 'REFUND').length,
        voids: transactions.filter(t => t.type === 'VOID').length,
      },
    };

    return summary;
  }

  /**
   * Get daily transaction volume
   */
  async getDailyVolume(date: string): Promise<{
    date: string;
    transaction_count: number;
    total_amount: number;
    currency: string;
  }> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await this.getTransactionsByDateRange(
      startDate.getTime(),
      endDate.getTime()
    );

    return {
      date,
      transaction_count: transactions.length,
      total_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
      currency: transactions[0]?.currency || 'CAD',
    };
  }

  /**
   * Check if transaction exists
   */
  async transactionExists(transactionId: string): Promise<boolean> {
    try {
      await this.getTransaction(transactionId);
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
            message: data.message || 'Transaction service error',
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
          message: `Transaction service error: ${status}`,
          status,
          details: data,
          request_id: error.response.headers['x-request-id'],
        },
        error
      );
    }

    if (error.request) {
      return ErrorFactory.networkError(
        'Network error in transaction service',
        error
      );
    }

    return ErrorFactory.fromApiResponse(
      {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error in transaction service',
      },
      error
    );
  }
}
