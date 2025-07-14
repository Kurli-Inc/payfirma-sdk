/**
 * Plan Service type definitions
 */

import { LookupReference, Currency } from './common';
import { SubscriptionFrequency } from './customer';

/**
 * Plan creation request
 */
export interface CreatePlanRequest {
  /** Plan name */
  name: string;
  /** Plan amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Billing frequency */
  frequency: SubscriptionFrequency;
  /** Number of payments (optional, unlimited if not specified) */
  number_of_payments?: number;
  /** Whether to send receipts to customers */
  send_receipt?: boolean;
  /** Plan description */
  description?: string;
}

/**
 * Plan update request
 */
export interface UpdatePlanRequest {
  /** New plan name */
  name?: string;
  /** New plan amount */
  amount?: number;
  /** New currency code */
  currency?: Currency;
  /** New billing frequency */
  frequency?: SubscriptionFrequency;
  /** New number of payments */
  number_of_payments?: number;
  /** New receipt setting */
  send_receipt?: boolean;
  /** New plan description */
  description?: string;
}

/**
 * Plan status
 */
export type PlanStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

/**
 * Complete plan object
 */
export interface Plan extends LookupReference {
  /** Plan name */
  name: string;
  /** Plan amount */
  amount: number;
  /** Currency code */
  currency: Currency;
  /** Billing frequency */
  frequency: SubscriptionFrequency;
  /** Number of payments (null for unlimited) */
  number_of_payments?: number;
  /** Whether to send receipts */
  send_receipt: boolean;
  /** Plan description */
  description?: string;
  /** Plan status */
  status: PlanStatus;
  /** Number of active subscriptions */
  active_subscriptions?: number;
  /** Plan creation date */
  created_at?: string;
  /** Plan last update date */
  updated_at?: string;
}

/**
 * Plan list response
 */
export interface PlanListResponse {
  /** Array of plans */
  entities: Plan[];
  /** Pagination information */
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}
