/**
 * Customer Service type definitions
 */

import { Address, ContactInfo, LookupReference, PaginationParams, Currency } from './common';

/**
 * Customer creation request
 */
export interface CreateCustomerRequest extends ContactInfo, Address {
  /** Customer email address (required) */
  email: string;
  /** Additional email for BCC receipts */
  bcc_emails?: string;
  /** Custom identifier for the customer */
  custom_id?: string;
}

/**
 * Customer update request
 */
export interface UpdateCustomerRequest extends Partial<ContactInfo>, Partial<Address> {
  /** Additional email for BCC receipts */
  bcc_emails?: string;
  /** Custom identifier for the customer */
  custom_id?: string;
}

/**
 * Customer search parameters
 */
export interface CustomerSearchParams extends PaginationParams {
  /** Filter by email address */
  email_address?: string;
  /** Filter by first name */
  first_name?: string;
  /** Filter by last name */
  last_name?: string;
  /** Filter by company name */
  company?: string;
  /** Filter customers with subscriptions */
  with_subscription?: boolean;
}

/**
 * Card information for creating/updating cards
 */
export interface CardRequest {
  /** Card number */
  card_number: string;
  /** Card expiry month (1-12) */
  card_expiry_month: number;
  /** Card expiry year (2-digit) */
  card_expiry_year: number;
  /** Card verification value */
  cvv2: string;
  /** Whether this card is the default payment method */
  is_default?: boolean;
  /** Description for the card */
  card_description?: string;
}

/**
 * Card update request
 */
export interface UpdateCardRequest {
  /** Card expiry month (1-12) */
  card_expiry_month?: number;
  /** Card expiry year (2-digit) */
  card_expiry_year?: number;
  /** Card verification value */
  cvv2?: string;
  /** Whether this card is the default payment method */
  is_default?: boolean;
  /** Description for the card */
  card_description?: string;
}

/**
 * Stored card information (PCI-compliant)
 */
export interface Card extends LookupReference {
  /** Card expiry in MM/YY format */
  card_expiry: string;
  /** First 4 digits of card number */
  card_prefix: string;
  /** Last 4 digits of card number */
  card_suffix: string;
  /** Whether this is the default card */
  is_default: boolean;
  /** Card description */
  card_description?: string;
}

/**
 * Subscription status
 */
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAUSED' | 'EXPIRED';

/**
 * Subscription frequency
 */
export type SubscriptionFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Subscription information
 */
export interface Subscription extends LookupReference {
  /** Associated plan ID */
  plan_id: number;
  /** Associated plan lookup ID */
  plan_lookup_id: string;
  /** Plan name */
  name: string;
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Subscription amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Billing frequency */
  frequency: SubscriptionFrequency;
  /** Last successful payment timestamp */
  last_success?: number;
  /** Last run timestamp */
  last_run?: number;
  /** Next scheduled run timestamp */
  next_run?: number;
  /** Total number of billing cycles */
  total_cycles?: number;
  /** Completed billing cycles */
  completed_cycles?: number;
  /** Remaining billing cycles */
  remaining_cycles?: number;
  /** Number of failed payment attempts */
  failed_attempts?: number;
  /** Number of delinquent cycles */
  delinquent_cycles?: number;
  /** Timestamp when subscription became delinquent */
  delinquent_since?: number;
}

/**
 * Subscription creation request
 */
export interface CreateSubscriptionRequest {
  /** Plan lookup ID */
  plan_lookup_id: string;
  /** Card lookup ID to use for payments */
  card_lookup_id: string;
  /** Subscription amount (can override plan amount) */
  amount?: number;
  /** Start date for subscription (Unix timestamp) */
  start_date?: number;
  /** Email for subscription receipts */
  email?: string;
  /** Subscription description */
  description?: string;
}

/**
 * Subscription update request
 */
export interface UpdateSubscriptionRequest {
  /** New subscription amount */
  amount?: number;
  /** New card lookup ID */
  card_lookup_id?: string;
  /** New start date */
  start_date?: number;
  /** New email for receipts */
  email?: string;
  /** New description */
  description?: string;
  /** New status */
  status?: SubscriptionStatus;
}

/**
 * Complete customer object
 */
export interface Customer extends LookupReference, ContactInfo, Address {
  /** Customer email address */
  email: string;
  /** Additional email for BCC receipts */
  bcc_emails?: string;
  /** Custom identifier */
  custom_id?: string;
  /** Associated cards */
  cards: Card[];
  /** Associated subscriptions */
  subscriptions: Subscription[];
}

/**
 * Customer list response
 */
export interface CustomerListResponse {
  /** Array of customers */
  entities: Customer[];
  /** Pagination information */
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
} 