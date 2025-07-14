/**
 * Customer service for managing customers, cards, and subscriptions
 */

import { AxiosInstance } from 'axios';
import { createApiClient } from '../utils/apiClient';
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
  private httpClient: AxiosInstance;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = createApiClient(
      { clientId: '', clientSecret: '', timeout: 30000 },
      environment,
      `${environment.gatewayUrl}/customer-service`
    );

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

  // Customer Management

  /**
   * Create a new customer
   */
  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    const response = await this.httpClient.post<Customer>('/customer', request);
    return response.data;
  }

  /**
   * Retrieve a specific customer by lookup ID
   */
  async getCustomer(customerLookupId: string): Promise<Customer> {
    const response = await this.httpClient.get<Customer>(
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
    const response = await this.httpClient.put<Customer>(
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
    const response = await this.httpClient.get<CustomerListResponse>(
      '/customer',
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
    const response = await this.httpClient.get<CustomerListResponse>(
      `/customer/plan/${planLookupId}`,
      { params }
    );
    return response.data;
  }

  // Card Management

  /**
   * Add a new card to a customer
   */
  async addCard(customerLookupId: string, request: CardRequest): Promise<Card> {
    const response = await this.httpClient.post<Card>(
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
    const response = await this.httpClient.put<Card>(
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
    await this.httpClient.delete(
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
    const response = await this.httpClient.post(
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
    const response = await this.httpClient.post(
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
    const response = await this.httpClient.post<Subscription>(
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
    const response = await this.httpClient.put<Subscription>(
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
    await this.httpClient.delete(
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
    const response = await this.httpClient.get<Subscription>(
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
