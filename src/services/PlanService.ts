/**
 * Plan service for managing recurring payment plans
 */

import { HttpClient, createApiClient, withAuth } from '../utils/apiClient';
import { AuthService } from './AuthService';
import { Environment } from '../types/common';
import {
  Plan,
  CreatePlanRequest,
  UpdatePlanRequest,
  PlanListResponse,
} from '../types/plan';
import { ErrorFactory, PayfirmaError } from '../types/errors';

/**
 * Plan service for managing recurring payment plans
 */
export class PlanService {
  private httpClient: HttpClient;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = createApiClient(
      { clientId: '', clientSecret: '', timeout: 30000 },
      environment,
      `${environment.gatewayUrl}/plan-service`
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

  /**
   * Create a new payment plan
   */
  async createPlan(request: CreatePlanRequest): Promise<Plan> {
    const response = await this.makeAuthenticatedRequest<Plan>(
      'post',
      '/plan',
      request
    );
    return response.data;
  }

  /**
   * Retrieve a specific plan by lookup ID
   */
  async getPlan(planLookupId: string): Promise<Plan> {
    const response = await this.makeAuthenticatedRequest<Plan>(
      'get',
      `/plan/${planLookupId}`
    );
    return response.data;
  }

  /**
   * Update a plan
   */
  async updatePlan(
    planLookupId: string,
    request: UpdatePlanRequest
  ): Promise<Plan> {
    const response = await this.makeAuthenticatedRequest<Plan>(
      'put',
      `/plan/${planLookupId}`,
      request
    );
    return response.data;
  }

  /**
   * Delete a plan
   */
  async deletePlan(planLookupId: string): Promise<void> {
    await this.makeAuthenticatedRequest<void>(
      'delete',
      `/plan/${planLookupId}`
    );
  }

  /**
   * List all plans
   */
  async listPlans(): Promise<PlanListResponse> {
    const response = await this.makeAuthenticatedRequest<PlanListResponse>(
      'get',
      '/plan'
    );
    return response.data;
  }

  /**
   * Get all active plans
   */
  async getActivePlans(): Promise<Plan[]> {
    const response = await this.listPlans();
    return response.entities.filter(plan => plan.status === 'ACTIVE');
  }

  /**
   * Get plans by frequency
   */
  async getPlansByFrequency(frequency: string): Promise<Plan[]> {
    const response = await this.listPlans();
    return response.entities.filter(plan => plan.frequency === frequency);
  }

  /**
   * Search plans by name
   */
  async searchPlansByName(name: string): Promise<Plan[]> {
    const response = await this.listPlans();
    return response.entities.filter(plan =>
      plan.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Get plans by amount range
   */
  async getPlansByAmountRange(
    minAmount: number,
    maxAmount: number
  ): Promise<Plan[]> {
    const response = await this.listPlans();
    return response.entities.filter(
      plan => plan.amount >= minAmount && plan.amount <= maxAmount
    );
  }

  /**
   * Check if plan exists
   */
  async planExists(planLookupId: string): Promise<boolean> {
    try {
      await this.getPlan(planLookupId);
      return true;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Activate a plan
   */
  async activatePlan(planLookupId: string): Promise<Plan> {
    // Note: Status update might not be supported by UpdatePlanRequest
    // This would need to be implemented based on actual API capabilities
    const plan = await this.getPlan(planLookupId);
    return { ...plan, status: 'ACTIVE' };
  }

  /**
   * Deactivate a plan
   */
  async deactivatePlan(planLookupId: string): Promise<Plan> {
    // Note: Status update might not be supported by UpdatePlanRequest
    // This would need to be implemented based on actual API capabilities
    const plan = await this.getPlan(planLookupId);
    return { ...plan, status: 'INACTIVE' };
  }

  /**
   * Create a daily plan
   */
  async createDailyPlan(
    name: string,
    amount: number,
    currency: string = 'CAD',
    numberOfPayments?: number
  ): Promise<Plan> {
    const request: CreatePlanRequest = {
      name,
      amount,
      currency: currency as any,
      frequency: 'DAILY',
      send_receipt: true,
    };

    if (numberOfPayments !== undefined) {
      request.number_of_payments = numberOfPayments;
    }

    return this.createPlan(request);
  }

  /**
   * Create a weekly plan
   */
  async createWeeklyPlan(
    name: string,
    amount: number,
    currency: string = 'CAD',
    numberOfPayments?: number
  ): Promise<Plan> {
    const request: CreatePlanRequest = {
      name,
      amount,
      currency: currency as any,
      frequency: 'WEEKLY',
      send_receipt: true,
    };

    if (numberOfPayments !== undefined) {
      request.number_of_payments = numberOfPayments;
    }

    return this.createPlan(request);
  }

  /**
   * Create a monthly plan
   */
  async createMonthlyPlan(
    name: string,
    amount: number,
    currency: string = 'CAD',
    numberOfPayments?: number
  ): Promise<Plan> {
    const request: CreatePlanRequest = {
      name,
      amount,
      currency: currency as any,
      frequency: 'MONTHLY',
      send_receipt: true,
    };

    if (numberOfPayments !== undefined) {
      request.number_of_payments = numberOfPayments;
    }

    return this.createPlan(request);
  }

  /**
   * Create a yearly plan
   */
  async createYearlyPlan(
    name: string,
    amount: number,
    currency: string = 'CAD',
    numberOfPayments?: number
  ): Promise<Plan> {
    const request: CreatePlanRequest = {
      name,
      amount,
      currency: currency as any,
      frequency: 'YEARLY',
      send_receipt: true,
    };

    if (numberOfPayments !== undefined) {
      request.number_of_payments = numberOfPayments;
    }

    return this.createPlan(request);
  }

  /**
   * Get plan statistics
   */
  async getPlanStatistics(): Promise<{
    totalPlans: number;
    activePlans: number;
    inactivePlans: number;
    plansByFrequency: Record<string, number>;
  }> {
    const response = await this.listPlans();
    const plans = response.entities;

    const stats = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'ACTIVE').length,
      inactivePlans: plans.filter(p => p.status === 'INACTIVE').length,
      plansByFrequency: plans.reduce((acc: Record<string, number>, plan) => {
        acc[plan.frequency] = (acc[plan.frequency] || 0) + 1;
        return acc;
      }, {}),
    };

    return stats;
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
            message: data.message || 'Plan service error',
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
          message: `Plan service error: ${status}`,
          status,
          details: data,
          request_id: error.response.headers['x-request-id'],
        },
        error
      );
    }

    if (error.request) {
      return ErrorFactory.networkError('Network error in plan service', error);
    }

    return ErrorFactory.fromApiResponse(
      {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error in plan service',
      },
      error
    );
  }
}
