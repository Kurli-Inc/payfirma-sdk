/**
 * Transaction Service type definitions
 */

import {
  LookupReference,
  Currency,
  ContactInfo,
  Address,
  PaginationParams,
  DateRange,
} from './common';

/**
 * Transaction types
 */
export type TransactionType =
  | 'SALE'
  | 'AUTHORIZATION'
  | 'CAPTURE'
  | 'REFUND'
  | 'VOID';

/**
 * Transaction status
 */
export type TransactionStatus =
  | 'APPROVED'
  | 'DECLINED'
  | 'PENDING'
  | 'CANCELLED'
  | 'FAILED';

/**
 * Card information for transactions
 */
export interface TransactionCard {
  /** Card number */
  card_number: string;
  /** Card expiry month (1-12) */
  card_expiry_month: number;
  /** Card expiry year (2-digit) */
  card_expiry_year: number;
  /** Card verification value */
  cvv2: string;
}

/**
 * Base transaction request
 */
export interface BaseTransactionRequest
  extends Partial<ContactInfo>,
    Partial<Address> {
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Whether this is a test transaction */
  test_mode?: boolean;
  /** Order ID for reference */
  order_id?: string;
  /** Transaction description */
  description?: string;
  /** Additional invoice/receipt information */
  invoice_info?: {
    /** Invoice number */
    invoice_number?: string;
    /** Purchase order number */
    po_number?: string;
    /** Tax amount */
    tax_amount?: number;
    /** Shipping amount */
    shipping_amount?: number;
    /** Discount amount */
    discount_amount?: number;
  };
  /** Custom fields */
  custom_fields?: Record<string, any>;
}

/**
 * Sale transaction request
 */
export interface SaleTransactionRequest extends BaseTransactionRequest {
  /** Card information or token */
  card?: TransactionCard;
  /** Encrypted card token */
  token?: string;
  /** Customer lookup ID for stored card payment */
  customer_lookup_id?: string;
  /** Specific card lookup ID (if not using default) */
  card_lookup_id?: string;
  /** Whether to send receipt email */
  send_receipt?: boolean;
}

/**
 * Authorization transaction request
 */
export interface AuthorizationTransactionRequest
  extends BaseTransactionRequest {
  /** Card information or token */
  card?: TransactionCard;
  /** Encrypted card token */
  token?: string;
  /** Customer lookup ID for stored card payment */
  customer_lookup_id?: string;
  /** Specific card lookup ID (if not using default) */
  card_lookup_id?: string;
  /** Whether to send receipt email */
  send_receipt?: boolean;
}

/**
 * Capture transaction request
 */
export interface CaptureTransactionRequest {
  /** Amount to capture (can be less than original authorization) */
  amount: number;
  /** Whether to send receipt email */
  send_receipt?: boolean;
}

/**
 * Refund transaction request
 */
export interface RefundTransactionRequest {
  /** Amount to refund (can be partial) */
  amount: number;
  /** Whether to send receipt email */
  send_receipt?: boolean;
  /** Reason for refund */
  reason?: string;
}

/**
 * Transaction search parameters
 */
export interface TransactionSearchParams extends PaginationParams, DateRange {
  /** Filter by transaction type */
  type?: TransactionType;
  /** Filter by transaction status */
  status?: TransactionStatus;
  /** Filter by customer email */
  customer_email?: string;
  /** Filter by order ID */
  order_id?: string;
  /** Filter by amount range */
  amount_min?: number;
  /** Filter by amount range */
  amount_max?: number;
  /** Filter by currency */
  currency?: Currency;
  /** Filter by card last 4 digits */
  card_suffix?: string;
  /** Filter test transactions */
  test_mode?: boolean;
}

/**
 * Transaction response
 */
export interface Transaction extends LookupReference {
  /** Transaction type */
  type: TransactionType;
  /** Transaction status */
  status: TransactionStatus;
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Authorization code */
  authorization_code?: string;
  /** Reference number */
  reference_number?: string;
  /** Order ID */
  order_id?: string;
  /** Transaction description */
  description?: string;
  /** Whether this is a test transaction */
  test_mode: boolean;
  /** Transaction timestamp */
  created_at: string;
  /** Transaction processed timestamp */
  processed_at?: string;
  /** Card information (masked) */
  card?: {
    /** Card type (Visa, MasterCard, etc.) */
    card_type: string;
    /** First 4 digits */
    card_prefix: string;
    /** Last 4 digits */
    card_suffix: string;
    /** Card expiry */
    card_expiry: string;
  };
  /** Customer information */
  customer?: ContactInfo &
    Address & {
      /** Customer lookup ID if stored */
      customer_lookup_id?: string;
    };
  /** Invoice information */
  invoice_info?: {
    /** Invoice number */
    invoice_number?: string;
    /** Purchase order number */
    po_number?: string;
    /** Tax amount */
    tax_amount?: number;
    /** Shipping amount */
    shipping_amount?: number;
    /** Discount amount */
    discount_amount?: number;
  };
  /** Original transaction ID for refunds/captures */
  original_transaction_id?: string;
  /** Gateway response message */
  gateway_message?: string;
  /** Risk score (if available) */
  risk_score?: number;
  /** AVS result */
  avs_result?: string;
  /** CVV result */
  cvv_result?: string;
  /** Fee amount */
  fee_amount?: number;
  /** Net amount after fees */
  net_amount?: number;
  /** Settlement date */
  settlement_date?: string;
  /** Custom fields */
  custom_fields?: Record<string, any>;
}

/**
 * Transaction list response
 */
export interface TransactionListResponse {
  /** Array of transactions */
  entities: Transaction[];
  /** Pagination information */
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

/**
 * Transaction summary for reporting
 */
export interface TransactionSummary {
  /** Total number of transactions */
  total_count: number;
  /** Total transaction amount */
  total_amount: number;
  /** Total fees */
  total_fees: number;
  /** Net amount */
  net_amount: number;
  /** Currency */
  currency: Currency;
  /** Breakdown by status */
  status_breakdown: {
    approved: number;
    declined: number;
    pending: number;
    cancelled: number;
    failed: number;
  };
  /** Breakdown by type */
  type_breakdown: {
    sales: number;
    authorizations: number;
    captures: number;
    refunds: number;
    voids: number;
  };
}
