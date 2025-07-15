/**
 * Customer service for managing customers, cards, and subscriptions
 */

import { HttpClient, createApiClient, withAuth } from '../utils/apiClient';
import { AuthService } from './AuthService';
import { Environment } from '../types/common';
import {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerSearchParams,
  CustomerListResponse,
  Card,
  CardRequest,
  UpdateCardRequest,
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '../types/customer';
import { ErrorFactory, PayfirmaError } from '../types/errors';

/**
 * Customer service for managing customers, cards, and subscriptions
 */
export class CustomerService {
  private httpClient: HttpClient;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = createApiClient(
      { clientId: '', clientSecret: '', timeout: 30000 },
      environment,
      `${environment.gatewayUrl}/customer-service`
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

  // Customer Management

  /**
   * Create a new customer
   */
  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    const response = await this.makeAuthenticatedRequest<Customer>(
      'post',
      '/customer',
      request
    );
    return response.data;
  }

  /**
   * Retrieve a specific customer by lookup ID
   */
  async getCustomer(customerLookupId: string): Promise<Customer> {
    const response = await this.makeAuthenticatedRequest<Customer>(
      'get',
      `/customer/${customerLookupId}`
    );
    return response.data;
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    customerLookupId: string,
    request: UpdateCustomerRequest
  ): Promise<Customer> {
    const response = await this.makeAuthenticatedRequest<Customer>(
      'put',
      `/customer/${customerLookupId}`,
      request
    );
    return response.data;
  }

  /**
   * List all customers with optional filtering
   */
  async listCustomers(
    params?: CustomerSearchParams
  ): Promise<CustomerListResponse> {
    const response = await this.makeAuthenticatedRequest<CustomerListResponse>(
      'get',
      '/customer',
      undefined,
      { params }
    );
    return response.data;
  }

  /**
   * Get customers for a specific plan
   */
  async getCustomersByPlan(
    planLookupId: string,
    params?: CustomerSearchParams
  ): Promise<CustomerListResponse> {
    const response = await this.makeAuthenticatedRequest<CustomerListResponse>(
      'get',
      `/customer/plan/${planLookupId}`,
      undefined,
      { params }
    );
    return response.data;
  }

  // Card Management

  /**
   * Add a new card to a customer
   */
  async addCard(customerLookupId: string, request: CardRequest): Promise<Card> {
    const response = await this.makeAuthenticatedRequest<Card>(
      'post',
      `/customer/${customerLookupId}/card`,
      request
    );
    return response.data;
  }

  /**
   * Update a card
   */
  async updateCard(
    customerLookupId: string,
    cardLookupId: string,
    request: UpdateCardRequest
  ): Promise<Card> {
    const response = await this.makeAuthenticatedRequest<Card>(
      'put',
      `/customer/${customerLookupId}/card/${cardLookupId}`,
      request
    );
    return response.data;
  }

  /**
   * Remove a card from a customer
   */
  async removeCard(
    customerLookupId: string,
    cardLookupId: string
  ): Promise<void> {
    await this.makeAuthenticatedRequest<void>(
      'delete',
      `/customer/${customerLookupId}/card/${cardLookupId}`
    );
  }

  /**
   * Make a payment with the default card
   */
  async chargeDefaultCard(
    customerLookupId: string,
    amount: number,
    currency: string = 'CAD'
  ): Promise<any> {
    const response = await this.makeAuthenticatedRequest<any>(
      'post',
      `/customer/${customerLookupId}/charge`,
      { amount, currency }
    );
    return response.data;
  }

  /**
   * Make a payment with a specific card
   */
  async chargeCard(
    customerLookupId: string,
    cardLookupId: string,
    amount: number,
    currency: string = 'CAD'
  ): Promise<any> {
    const response = await this.makeAuthenticatedRequest<any>(
      'post',
      `/customer/${customerLookupId}/card/${cardLookupId}/charge`,
      { amount, currency }
    );
    return response.data;
  }

  // Subscription Management

  /**
   * Create a new subscription for a customer
   */
  async createSubscription(
    customerLookupId: string,
    request: CreateSubscriptionRequest
  ): Promise<Subscription> {
    const response = await this.makeAuthenticatedRequest<Subscription>(
      'post',
      `/customer/${customerLookupId}/subscription`,
      request
    );
    return response.data;
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    customerLookupId: string,
    subscriptionLookupId: string,
    request: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    const response = await this.makeAuthenticatedRequest<Subscription>(
      'put',
      `/customer/${customerLookupId}/subscription/${subscriptionLookupId}`,
      request
    );
    return response.data;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    customerLookupId: string,
    subscriptionLookupId: string
  ): Promise<void> {
    await this.makeAuthenticatedRequest<void>(
      'delete',
      `/customer/${customerLookupId}/subscription/${subscriptionLookupId}`
    );
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    customerLookupId: string,
    subscriptionLookupId: string
  ): Promise<Subscription> {
    const response = await this.makeAuthenticatedRequest<Subscription>(
      'get',
      `/customer/${customerLookupId}/subscription/${subscriptionLookupId}`
    );
    return response.data;
  }

  /**
   * List all subscriptions for a customer
   */
  async listSubscriptions(customerLookupId: string): Promise<Subscription[]> {
    const customer = await this.getCustomer(customerLookupId);
    return customer.subscriptions || [];
  }

  // Utility Methods

  /**
   * Search customers by email
   */
  async searchCustomersByEmail(email: string): Promise<Customer[]> {
    const response = await this.listCustomers({ email_address: email });
    return response.entities;
  }

  /**
   * Search customers by name
   */
  async searchCustomersByName(
    firstName?: string,
    lastName?: string
  ): Promise<Customer[]> {
    const params: CustomerSearchParams = {};
    if (firstName) params.first_name = firstName;
    if (lastName) params.last_name = lastName;

    const response = await this.listCustomers(params);
    return response.entities;
  }

  /**
   * Get customers with active subscriptions
   */
  async getCustomersWithSubscriptions(): Promise<Customer[]> {
    const response = await this.listCustomers({ with_subscription: true });
    return response.entities;
  }

  /**
   * Get default card for a customer
   */
  async getDefaultCard(customerLookupId: string): Promise<Card | null> {
    const customer = await this.getCustomer(customerLookupId);
    return customer.cards.find(card => card.is_default) || null;
  }

  /**
   * Set a card as default
   */
  async setDefaultCard(
    customerLookupId: string,
    cardLookupId: string
  ): Promise<Card> {
    return this.updateCard(customerLookupId, cardLookupId, {
      is_default: true,
    });
  }

  /**
   * Check if customer exists
   */
  async customerExists(customerLookupId: string): Promise<boolean> {
    try {
      await this.getCustomer(customerLookupId);
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
            message: data.message || 'Customer service error',
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
          message: `Customer service error: ${status}`,
          status,
          details: data,
          request_id: error.response.headers['x-request-id'],
        },
        error
      );
    }

    if (error.request) {
      return ErrorFactory.networkError(
        'Network error in customer service',
        error
      );
    }

    return ErrorFactory.fromApiResponse(
      {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error in customer service',
      },
      error
    );
  }
}
