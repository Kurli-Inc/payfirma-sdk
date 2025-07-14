/**
 * EFT (Electronic Funds Transfer) Service type definitions
 */

import { Currency, ContactInfo, Address } from './common';

/**
 * EFT transaction types
 */
export type EFTTransactionType = 'DEBIT' | 'CREDIT' | 'DEPOSIT' | 'WITHDRAWAL';

/**
 * EFT transaction status
 */
export type EFTTransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/**
 * Bank account information
 */
export interface BankAccount {
  /** Bank account number */
  account_number: string;
  /** Bank routing number */
  routing_number: string;
  /** Account type */
  account_type: 'CHECKING' | 'SAVINGS';
  /** Account holder name */
  account_holder_name: string;
  /** Bank name */
  bank_name?: string;
}

/**
 * EFT debit request (incoming funds)
 */
export interface EFTDebitRequest extends Partial<ContactInfo>, Partial<Address> {
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Bank account information */
  bank_account: BankAccount;
  /** Transaction description */
  description?: string;
  /** Reference number */
  reference_number?: string;
  /** Whether to send receipt email */
  send_receipt?: boolean;
}

/**
 * EFT credit request (outgoing funds)
 */
export interface EFTCreditRequest extends Partial<ContactInfo>, Partial<Address> {
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Bank account information */
  bank_account: BankAccount;
  /** Transaction description */
  description?: string;
  /** Reference number */
  reference_number?: string;
  /** Whether to send receipt email */
  send_receipt?: boolean;
}

/**
 * Bank deposit request
 */
export interface BankDepositRequest {
  /** Deposit amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Destination bank account */
  bank_account: BankAccount;
  /** Deposit description */
  description?: string;
  /** Reference number */
  reference_number?: string;
}

/**
 * EFT balance response
 */
export interface EFTBalance {
  /** Available balance */
  available_balance: number;
  /** Pending balance */
  pending_balance: number;
  /** Total balance */
  total_balance: number;
  /** Currency code */
  currency: Currency;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * EFT transaction response
 */
export interface EFTTransaction {
  /** Transaction ID */
  id: string;
  /** Transaction type */
  type: EFTTransactionType;
  /** Transaction status */
  status: EFTTransactionStatus;
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Transaction description */
  description?: string;
  /** Reference number */
  reference_number?: string;
  /** Transaction timestamp */
  created_at: string;
  /** Processing timestamp */
  processed_at?: string;
  /** Settlement timestamp */
  settled_at?: string;
  /** Customer information */
  customer?: ContactInfo & Address;
  /** Bank account information (masked) */
  bank_account?: {
    /** Masked account number */
    account_number_masked: string;
    /** Bank routing number */
    routing_number: string;
    /** Account type */
    account_type: string;
    /** Account holder name */
    account_holder_name: string;
    /** Bank name */
    bank_name?: string;
  };
  /** Processing fees */
  fee_amount?: number;
  /** Net amount after fees */
  net_amount?: number;
  /** Gateway response message */
  gateway_message?: string;
  /** Transaction trace number */
  trace_number?: string;
}

/**
 * EFT transaction list response
 */
export interface EFTTransactionListResponse {
  /** Array of EFT transactions */
  entities: EFTTransaction[];
  /** Pagination information */
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

/**
 * EFT transaction search parameters
 */
export interface EFTTransactionSearchParams {
  /** Filter by transaction type */
  type?: EFTTransactionType;
  /** Filter by transaction status */
  status?: EFTTransactionStatus;
  /** Filter by amount range */
  amount_min?: number;
  /** Filter by amount range */
  amount_max?: number;
  /** Filter by currency */
  currency?: Currency;
  /** Filter by date range */
  start_date?: string;
  /** Filter by date range */
  end_date?: string;
  /** Filter by reference number */
  reference_number?: string;
  /** Number of results to return */
  limit?: number;
  /** Pagination cursor */
  before?: string;
  /** Pagination cursor */
  after?: string;
} 