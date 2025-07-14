/**
 * EFT service for electronic funds transfer operations
 */

import axios, { AxiosInstance } from 'axios';
import { AuthService } from './AuthService';
import { Environment } from '../types/common';
import {
  EFTTransaction,
  EFTDebitRequest,
  EFTCreditRequest,
  BankDepositRequest,
  EFTBalance,
  EFTTransactionListResponse,
  EFTTransactionSearchParams,
} from '../types/eft';
import { ErrorFactory, PayfirmaError } from '../types/errors';

/**
 * EFT service for electronic funds transfer operations
 */
export class EFTService {
  private httpClient: AxiosInstance;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = axios.create({
      baseURL: `${environment.gatewayUrl}/eft-service`,
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

  /**
   * Get account balance
   */
  async getBalance(): Promise<EFTBalance> {
    const response = await this.httpClient.get<EFTBalance>('/balance');
    return response.data;
  }

  /**
   * Process an EFT debit (incoming funds)
   */
  async processDebit(request: EFTDebitRequest): Promise<EFTTransaction> {
    const response = await this.httpClient.post<EFTTransaction>(
      '/debit',
      request
    );
    return response.data;
  }

  /**
   * Process an EFT credit (outgoing funds)
   */
  async processCredit(request: EFTCreditRequest): Promise<EFTTransaction> {
    const response = await this.httpClient.post<EFTTransaction>(
      '/credit',
      request
    );
    return response.data;
  }

  /**
   * Make a bank deposit
   */
  async bankDeposit(request: BankDepositRequest): Promise<EFTTransaction> {
    const response = await this.httpClient.post<EFTTransaction>(
      '/deposit',
      request
    );
    return response.data;
  }

  /**
   * Get EFT transaction details
   */
  async getTransaction(transactionId: string): Promise<EFTTransaction> {
    const response = await this.httpClient.get<EFTTransaction>(
      `/transaction/${transactionId}`
    );
    return response.data;
  }

  /**
   * List EFT transactions with filtering
   */
  async listTransactions(
    params?: EFTTransactionSearchParams
  ): Promise<EFTTransactionListResponse> {
    const response = await this.httpClient.get<EFTTransactionListResponse>(
      '/transactions',
      { params }
    );
    return response.data;
  }

  /**
   * Get transactions by status
   */
  async getTransactionsByStatus(status: string): Promise<EFTTransaction[]> {
    const response = await this.listTransactions({ status: status as any });
    return response.entities;
  }

  /**
   * Get transactions by type
   */
  async getTransactionsByType(type: string): Promise<EFTTransaction[]> {
    const response = await this.listTransactions({ type: type as any });
    return response.entities;
  }

  /**
   * Get transactions by date range
   */
  async getTransactionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<EFTTransaction[]> {
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
  ): Promise<EFTTransaction[]> {
    const response = await this.listTransactions({
      amount_min: minAmount,
      amount_max: maxAmount,
    });
    return response.entities;
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<EFTTransaction[]> {
    return this.getTransactionsByStatus('PENDING');
  }

  /**
   * Get completed transactions
   */
  async getCompletedTransactions(): Promise<EFTTransaction[]> {
    return this.getTransactionsByStatus('COMPLETED');
  }

  /**
   * Get failed transactions
   */
  async getFailedTransactions(): Promise<EFTTransaction[]> {
    return this.getTransactionsByStatus('FAILED');
  }

  /**
   * Get debit transactions
   */
  async getDebitTransactions(): Promise<EFTTransaction[]> {
    return this.getTransactionsByType('DEBIT');
  }

  /**
   * Get credit transactions
   */
  async getCreditTransactions(): Promise<EFTTransaction[]> {
    return this.getTransactionsByType('CREDIT');
  }

  /**
   * Get deposit transactions
   */
  async getDepositTransactions(): Promise<EFTTransaction[]> {
    return this.getTransactionsByType('DEPOSIT');
  }

  /**
   * Quick debit operation
   */
  async quickDebit(
    amount: number,
    accountNumber: string,
    routingNumber: string,
    accountHolderName: string,
    currency: string = 'CAD'
  ): Promise<EFTTransaction> {
    return this.processDebit({
      amount,
      currency: currency as any,
      bank_account: {
        account_number: accountNumber,
        routing_number: routingNumber,
        account_type: 'CHECKING',
        account_holder_name: accountHolderName,
      },
    });
  }

  /**
   * Quick credit operation
   */
  async quickCredit(
    amount: number,
    accountNumber: string,
    routingNumber: string,
    accountHolderName: string,
    currency: string = 'CAD'
  ): Promise<EFTTransaction> {
    return this.processCredit({
      amount,
      currency: currency as any,
      bank_account: {
        account_number: accountNumber,
        routing_number: routingNumber,
        account_type: 'CHECKING',
        account_holder_name: accountHolderName,
      },
    });
  }

  /**
   * Quick bank deposit
   */
  async quickBankDeposit(
    amount: number,
    accountNumber: string,
    routingNumber: string,
    accountHolderName: string,
    currency: string = 'CAD'
  ): Promise<EFTTransaction> {
    return this.bankDeposit({
      amount,
      currency: currency as any,
      bank_account: {
        account_number: accountNumber,
        routing_number: routingNumber,
        account_type: 'CHECKING',
        account_holder_name: accountHolderName,
      },
    });
  }

  /**
   * Get account summary
   */
  async getAccountSummary(): Promise<{
    balance: EFTBalance;
    recent_transactions: EFTTransaction[];
    pending_count: number;
    completed_today: number;
    failed_today: number;
  }> {
    const [balance, recentTransactions, pendingTransactions] =
      await Promise.all([
        this.getBalance(),
        this.listTransactions({ limit: 10 }),
        this.getPendingTransactions(),
      ]);

    const today =
      new Date().toISOString().split('T')[0] ||
      new Date().toISOString().slice(0, 10);
    const todayTransactions = await this.getTransactionsByDateRange(
      today,
      today
    );

    return {
      balance,
      recent_transactions: recentTransactions.entities,
      pending_count: pendingTransactions.length,
      completed_today: todayTransactions.filter(t => t.status === 'COMPLETED')
        .length,
      failed_today: todayTransactions.filter(t => t.status === 'FAILED').length,
    };
  }

  /**
   * Get daily EFT volume
   */
  async getDailyVolume(date: string): Promise<{
    date: string;
    transaction_count: number;
    debit_count: number;
    credit_count: number;
    deposit_count: number;
    total_amount: number;
    debit_amount: number;
    credit_amount: number;
    deposit_amount: number;
    currency: string;
  }> {
    const transactions = await this.getTransactionsByDateRange(date, date);

    const debits = transactions.filter(t => t.type === 'DEBIT');
    const credits = transactions.filter(t => t.type === 'CREDIT');
    const deposits = transactions.filter(t => t.type === 'DEPOSIT');

    return {
      date,
      transaction_count: transactions.length,
      debit_count: debits.length,
      credit_count: credits.length,
      deposit_count: deposits.length,
      total_amount: transactions.reduce((sum, t) => sum + t.amount, 0),
      debit_amount: debits.reduce((sum, t) => sum + t.amount, 0),
      credit_amount: credits.reduce((sum, t) => sum + t.amount, 0),
      deposit_amount: deposits.reduce((sum, t) => sum + t.amount, 0),
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
   * Validate bank account format
   */
  validateBankAccount(
    accountNumber: string,
    routingNumber: string
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation for account number
    if (
      !accountNumber ||
      accountNumber.length < 4 ||
      accountNumber.length > 17
    ) {
      errors.push('Account number must be between 4 and 17 digits');
    }

    if (!/^\d+$/.test(accountNumber)) {
      errors.push('Account number must contain only digits');
    }

    // Basic validation for routing number (US format)
    if (!routingNumber || routingNumber.length !== 9) {
      errors.push('Routing number must be 9 digits');
    }

    if (!/^\d+$/.test(routingNumber)) {
      errors.push('Routing number must contain only digits');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
            message: data.message || 'EFT service error',
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
          message: `EFT service error: ${status}`,
          status,
          details: data,
          request_id: error.response.headers['x-request-id'],
        },
        error
      );
    }

    if (error.request) {
      return ErrorFactory.networkError('Network error in EFT service', error);
    }

    return ErrorFactory.fromApiResponse(
      {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error in EFT service',
      },
      error
    );
  }
}
