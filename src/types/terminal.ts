/**
 * Card Terminal Service type definitions
 */

import { Currency, ContactInfo, Address } from './common';

/**
 * Terminal transaction types
 */
export type TerminalTransactionType =
  | 'SALE'
  | 'REFUND'
  | 'AUTHORIZATION'
  | 'CAPTURE';

/**
 * Terminal transaction status
 */
export type TerminalTransactionStatus =
  | 'APPROVED'
  | 'DECLINED'
  | 'PENDING'
  | 'CANCELLED'
  | 'FAILED';

/**
 * Terminal sale request with customer lookup
 */
export interface TerminalSaleWithCustomerRequest {
  /** Customer lookup ID */
  customer_lookup_id: string;
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Whether to send receipt email */
  send_receipt?: boolean;
  /** Terminal ID */
  terminal_id?: string;
  /** Transaction description */
  description?: string;
}

/**
 * Terminal sale request without customer lookup
 */
export interface TerminalSaleRequest
  extends Partial<ContactInfo>,
    Partial<Address> {
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Whether to send receipt email */
  send_receipt?: boolean;
  /** Terminal ID */
  terminal_id?: string;
  /** Transaction description */
  description?: string;
}

/**
 * Terminal refund request
 */
export interface TerminalRefundRequest {
  /** Original transaction ID */
  original_transaction_id: string;
  /** Refund amount */
  amount: number;
  /** Whether to send receipt email */
  send_receipt?: boolean;
  /** Terminal ID */
  terminal_id?: string;
  /** Refund reason */
  reason?: string;
}

/**
 * Terminal authorization request
 */
export interface TerminalAuthorizationRequest
  extends Partial<ContactInfo>,
    Partial<Address> {
  /** Authorization amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Whether to send receipt email */
  send_receipt?: boolean;
  /** Terminal ID */
  terminal_id?: string;
  /** Transaction description */
  description?: string;
}

/**
 * Terminal capture request
 */
export interface TerminalCaptureRequest {
  /** Amount to capture */
  amount: number;
  /** Whether to send receipt email */
  send_receipt?: boolean;
  /** Terminal ID */
  terminal_id?: string;
}

/**
 * Terminal transaction response
 */
export interface TerminalTransaction {
  /** Transaction ID */
  id: string;
  /** Transaction type */
  type: TerminalTransactionType;
  /** Transaction status */
  status: TerminalTransactionStatus;
  /** Transaction amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Terminal ID */
  terminal_id: string;
  /** Authorization code */
  authorization_code?: string;
  /** Reference number */
  reference_number?: string;
  /** Transaction timestamp */
  created_at: string;
  /** Customer information */
  customer?: ContactInfo &
    Address & {
      /** Customer lookup ID if stored */
      customer_lookup_id?: string;
    };
  /** Card information (masked) */
  card?: {
    /** Card type */
    card_type: string;
    /** Last 4 digits */
    card_suffix: string;
    /** Card entry method */
    entry_method: string;
  };
  /** Receipt information */
  receipt?: {
    /** Receipt number */
    receipt_number: string;
    /** Receipt URL */
    receipt_url?: string;
  };
  /** Original transaction ID for refunds/captures */
  original_transaction_id?: string;
  /** Gateway response message */
  gateway_message?: string;
}

/**
 * Terminal configuration
 */
export interface TerminalConfig {
  /** Terminal ID */
  terminal_id: string;
  /** Terminal name */
  name: string;
  /** Terminal type */
  type: string;
  /** Terminal status */
  status: 'ACTIVE' | 'INACTIVE' | 'OFFLINE';
  /** Terminal location */
  location?: string;
  /** Supported payment methods */
  payment_methods: string[];
  /** Terminal settings */
  settings?: {
    /** Default currency */
    default_currency: Currency;
    /** Enable tips */
    enable_tips: boolean;
    /** Enable receipts */
    enable_receipts: boolean;
    /** Timeout settings */
    timeout: number;
  };
}
