/**
 * Invoice Service type definitions
 */

import { LookupReference, Currency, ContactInfo, Address, PaginationParams, DateRange } from './common';

/**
 * Invoice status
 */
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

/**
 * Invoice item
 */
export interface InvoiceItem {
  /** Item description */
  description: string;
  /** Item quantity */
  quantity: number;
  /** Unit price */
  unit_price: number;
  /** Total amount for this item */
  total_amount: number;
  /** Tax amount for this item */
  tax_amount?: number;
  /** SKU or product code */
  sku?: string;
}

/**
 * Invoice creation request
 */
export interface CreateInvoiceRequest extends Partial<ContactInfo>, Partial<Address> {
  /** Invoice number */
  invoice_number: string;
  /** Invoice due date */
  due_date: string;
  /** Invoice items */
  items: InvoiceItem[];
  /** Currency code */
  currency: Currency;
  /** Tax rate percentage */
  tax_rate?: number;
  /** Discount amount */
  discount_amount?: number;
  /** Shipping amount */
  shipping_amount?: number;
  /** Invoice notes */
  notes?: string;
  /** Terms and conditions */
  terms?: string;
  /** Whether to send email notification */
  send_email?: boolean;
  /** Custom fields */
  custom_fields?: Record<string, any>;
}

/**
 * Invoice update request
 */
export interface UpdateInvoiceRequest extends Partial<ContactInfo>, Partial<Address> {
  /** Invoice number */
  invoice_number?: string;
  /** Invoice due date */
  due_date?: string;
  /** Invoice items */
  items?: InvoiceItem[];
  /** Currency code */
  currency?: Currency;
  /** Tax rate percentage */
  tax_rate?: number;
  /** Discount amount */
  discount_amount?: number;
  /** Shipping amount */
  shipping_amount?: number;
  /** Invoice notes */
  notes?: string;
  /** Terms and conditions */
  terms?: string;
  /** Invoice status */
  status?: InvoiceStatus;
  /** Custom fields */
  custom_fields?: Record<string, any>;
}

/**
 * Invoice search parameters
 */
export interface InvoiceSearchParams extends PaginationParams, DateRange {
  /** Filter by invoice status */
  status?: InvoiceStatus;
  /** Filter by customer email */
  customer_email?: string;
  /** Filter by invoice number */
  invoice_number?: string;
  /** Filter by amount range */
  amount_min?: number;
  /** Filter by amount range */
  amount_max?: number;
  /** Filter by currency */
  currency?: Currency;
  /** Filter by customer lookup ID */
  customer_lookup_id?: string;
}

/**
 * Invoice email request
 */
export interface SendInvoiceEmailRequest {
  /** Recipient email address */
  email: string;
  /** Email subject */
  subject?: string;
  /** Email message */
  message?: string;
  /** Whether to send copy to merchant */
  send_copy?: boolean;
}

/**
 * Complete invoice object
 */
export interface Invoice extends LookupReference {
  /** Invoice number */
  invoice_number: string;
  /** Invoice status */
  status: InvoiceStatus;
  /** Invoice due date */
  due_date: string;
  /** Invoice creation date */
  created_at: string;
  /** Invoice last update date */
  updated_at?: string;
  /** Invoice paid date */
  paid_at?: string;
  /** Invoice items */
  items: InvoiceItem[];
  /** Currency code */
  currency: Currency;
  /** Subtotal amount */
  subtotal_amount: number;
  /** Tax amount */
  tax_amount: number;
  /** Discount amount */
  discount_amount: number;
  /** Shipping amount */
  shipping_amount: number;
  /** Total amount */
  total_amount: number;
  /** Tax rate percentage */
  tax_rate: number;
  /** Customer information */
  customer: ContactInfo & Address & {
    /** Customer lookup ID if stored */
    customer_lookup_id?: string;
  };
  /** Invoice notes */
  notes?: string;
  /** Terms and conditions */
  terms?: string;
  /** Payment URL for customers */
  payment_url?: string;
  /** PDF download URL */
  pdf_url?: string;
  /** Custom fields */
  custom_fields?: Record<string, any>;
  /** Payment information (if paid) */
  payment_info?: {
    /** Payment transaction ID */
    transaction_id: string;
    /** Payment method */
    payment_method: string;
    /** Payment date */
    payment_date: string;
    /** Payment amount */
    payment_amount: number;
  };
}

/**
 * Invoice list response
 */
export interface InvoiceListResponse {
  /** Array of invoices */
  entities: Invoice[];
  /** Pagination information */
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

/**
 * Invoice summary for reporting
 */
export interface InvoiceSummary {
  /** Total number of invoices */
  total_count: number;
  /** Total invoice amount */
  total_amount: number;
  /** Total paid amount */
  paid_amount: number;
  /** Total outstanding amount */
  outstanding_amount: number;
  /** Total overdue amount */
  overdue_amount: number;
  /** Currency */
  currency: Currency;
  /** Breakdown by status */
  status_breakdown: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
} 