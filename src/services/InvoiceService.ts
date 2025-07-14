/**
 * Invoice service for managing invoices
 */

import axios, { AxiosInstance } from 'axios';
import { AuthService } from './AuthService';
import { Environment } from '../types/common';
import {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceSearchParams,
  InvoiceListResponse,
  SendInvoiceEmailRequest,
  InvoiceSummary,
} from '../types/invoice';
import { ErrorFactory, PayfirmaError } from '../types/errors';

/**
 * Invoice service for managing invoices
 */
export class InvoiceService {
  private httpClient: AxiosInstance;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = axios.create({
      baseURL: `${environment.gatewayUrl}/invoice-service`,
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
   * Create a new invoice
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    const response = await this.httpClient.post<Invoice>('/invoice', request);
    return response.data;
  }

  /**
   * Create a draft invoice
   */
  async createDraftInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    const draftRequest = { ...request, send_email: false };
    return this.createInvoice(draftRequest);
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.httpClient.get<Invoice>(
      `/invoice/${invoiceId}`
    );
    return response.data;
  }

  /**
   * Update an invoice
   */
  async updateInvoice(
    invoiceId: string,
    request: UpdateInvoiceRequest
  ): Promise<Invoice> {
    const response = await this.httpClient.put<Invoice>(
      `/invoice/${invoiceId}`,
      request
    );
    return response.data;
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    await this.httpClient.delete(`/invoice/${invoiceId}`);
  }

  /**
   * List invoices with optional filtering
   */
  async listInvoices(
    params?: InvoiceSearchParams
  ): Promise<InvoiceListResponse> {
    const response = await this.httpClient.get<InvoiceListResponse>(
      '/invoice',
      { params }
    );
    return response.data;
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(
    invoiceId: string,
    request: SendInvoiceEmailRequest
  ): Promise<void> {
    await this.httpClient.post(`/invoice/${invoiceId}/send`, request);
  }

  /**
   * Send invoice to specific email
   */
  async sendInvoiceToEmail(
    invoiceId: string,
    email: string,
    subject?: string,
    message?: string
  ): Promise<void> {
    const request: SendInvoiceEmailRequest = {
      email,
    };

    if (subject !== undefined) {
      request.subject = subject;
    }

    if (message !== undefined) {
      request.message = message;
    }

    await this.sendInvoiceEmail(invoiceId, request);
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId: string): Promise<Invoice> {
    return this.updateInvoice(invoiceId, { status: 'PAID' });
  }

  /**
   * Mark invoice as cancelled
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    return this.updateInvoice(invoiceId, { status: 'CANCELLED' });
  }

  // Search and Filter Methods

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    const response = await this.listInvoices({ status: status as any });
    return response.entities;
  }

  /**
   * Get invoices by customer
   */
  async getInvoicesByCustomer(customerLookupId: string): Promise<Invoice[]> {
    const response = await this.listInvoices({
      customer_lookup_id: customerLookupId,
    });
    return response.entities;
  }

  /**
   * Get invoices by customer email
   */
  async getInvoicesByCustomerEmail(email: string): Promise<Invoice[]> {
    const response = await this.listInvoices({ customer_email: email });
    return response.entities;
  }

  /**
   * Get invoices by date range
   */
  async getInvoicesByDateRange(
    startDate: string | number,
    endDate: string | number
  ): Promise<Invoice[]> {
    const response = await this.listInvoices({
      start_date: startDate,
      end_date: endDate,
    });
    return response.entities;
  }

  /**
   * Get invoices by amount range
   */
  async getInvoicesByAmountRange(
    minAmount: number,
    maxAmount: number
  ): Promise<Invoice[]> {
    const response = await this.listInvoices({
      amount_min: minAmount,
      amount_max: maxAmount,
    });
    return response.entities;
  }

  /**
   * Search invoices by invoice number
   */
  async searchInvoicesByNumber(invoiceNumber: string): Promise<Invoice[]> {
    const response = await this.listInvoices({ invoice_number: invoiceNumber });
    return response.entities;
  }

  /**
   * Get draft invoices
   */
  async getDraftInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('DRAFT');
  }

  /**
   * Get sent invoices
   */
  async getSentInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('SENT');
  }

  /**
   * Get paid invoices
   */
  async getPaidInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('PAID');
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('OVERDUE');
  }

  /**
   * Get cancelled invoices
   */
  async getCancelledInvoices(): Promise<Invoice[]> {
    return this.getInvoicesByStatus('CANCELLED');
  }

  // Utility Methods

  /**
   * Check if invoice exists
   */
  async invoiceExists(invoiceId: string): Promise<boolean> {
    try {
      await this.getInvoice(invoiceId);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Calculate invoice totals
   */
  calculateInvoiceTotals(
    items: Array<{ quantity: number; unit_price: number }>,
    taxRate: number = 0,
    discountAmount: number = 0,
    shippingAmount: number = 0
  ): {
    subtotal: number;
    tax: number;
    discount: number;
    shipping: number;
    total: number;
  } {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax - discountAmount + shippingAmount;

    return {
      subtotal,
      tax,
      discount: discountAmount,
      shipping: shippingAmount,
      total,
    };
  }

  /**
   * Create a simple invoice
   */
  async createSimpleInvoice(
    invoiceNumber: string,
    customerEmail: string,
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
    }>,
    dueDate: string,
    options?: {
      taxRate?: number;
      discountAmount?: number;
      shippingAmount?: number;
      notes?: string;
      currency?: string;
    }
  ): Promise<Invoice> {
    const currency = options?.currency || 'CAD';
    const taxRate = options?.taxRate || 0;
    const discountAmount = options?.discountAmount || 0;
    const shippingAmount = options?.shippingAmount || 0;

    const invoiceItems = items.map(item => ({
      ...item,
      total_amount: item.quantity * item.unit_price,
      tax_amount: item.quantity * item.unit_price * (taxRate / 100),
    }));

    const request: CreateInvoiceRequest = {
      invoice_number: invoiceNumber,
      due_date: dueDate,
      items: invoiceItems,
      currency: currency as any,
      tax_rate: taxRate,
      discount_amount: discountAmount,
      shipping_amount: shippingAmount,
      email: customerEmail,
    };

    if (options?.notes !== undefined) {
      request.notes = options.notes;
    }

    return this.createInvoice(request);
  }

  /**
   * Get invoice summary/analytics
   */
  async getInvoiceSummary(
    params?: InvoiceSearchParams
  ): Promise<InvoiceSummary> {
    const response = await this.listInvoices(params);
    const invoices = response.entities;

    const summary: InvoiceSummary = {
      total_count: invoices.length,
      total_amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      paid_amount: invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.total_amount, 0),
      outstanding_amount: invoices
        .filter(inv => inv.status === 'SENT')
        .reduce((sum, inv) => sum + inv.total_amount, 0),
      overdue_amount: invoices
        .filter(inv => inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + inv.total_amount, 0),
      currency: invoices[0]?.currency || 'CAD',
      status_breakdown: {
        draft: invoices.filter(inv => inv.status === 'DRAFT').length,
        sent: invoices.filter(inv => inv.status === 'SENT').length,
        paid: invoices.filter(inv => inv.status === 'PAID').length,
        overdue: invoices.filter(inv => inv.status === 'OVERDUE').length,
        cancelled: invoices.filter(inv => inv.status === 'CANCELLED').length,
      },
    };

    return summary;
  }

  /**
   * Get monthly invoice statistics
   */
  async getMonthlyInvoiceStats(
    year: number,
    month: number
  ): Promise<{
    month: string;
    invoices_created: number;
    invoices_paid: number;
    total_amount: number;
    paid_amount: number;
    currency: string;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const invoices = await this.getInvoicesByDateRange(
      startDate.getTime(),
      endDate.getTime()
    );

    return {
      month: `${year}-${month.toString().padStart(2, '0')}`,
      invoices_created: invoices.length,
      invoices_paid: invoices.filter(inv => inv.status === 'PAID').length,
      total_amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      paid_amount: invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.total_amount, 0),
      currency: invoices[0]?.currency || 'CAD',
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
            message: data.message || 'Invoice service error',
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
          message: `Invoice service error: ${status}`,
          status,
          details: data,
          request_id: error.response.headers['x-request-id'],
        },
        error
      );
    }

    if (error.request) {
      return ErrorFactory.networkError(
        'Network error in invoice service',
        error
      );
    }

    return ErrorFactory.fromApiResponse(
      {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error in invoice service',
      },
      error
    );
  }
}
