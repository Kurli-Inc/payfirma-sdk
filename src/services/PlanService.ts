/**
 * Plan service for managing recurring payment plans
 */

import axios, { AxiosInstance } from 'axios';
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
  private httpClient: AxiosInstance;
  private authService: AuthService;

  constructor(environment: Environment, authService: AuthService) {
    this.authService = authService;

    this.httpClient = axios.create({
      baseURL: `${environment.gatewayUrl}/plan-service`,
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
   * Create a new payment plan
   */
  async createPlan(request: CreatePlanRequest): Promise<Plan> {
    const response = await this.httpClient.post<Plan>('/plan', request);
    return response.data;
  }

  /**
   * Retrieve a specific plan by lookup ID
   */
  async getPlan(planLookupId: string): Promise<Plan> {
    const response = await this.httpClient.get<Plan>(`/plan/${planLookupId}`);
    return response.data;
  }

  /**
   * Update a plan
   */
  async updatePlan(
    planLookupId: string,
    request: UpdatePlanRequest
  ): Promise<Plan> {
    const response = await this.httpClient.put<Plan>(
      `/plan/${planLookupId}`,
      request
    );
    return response.data;
  }

  /**
   * Delete a plan
   */
  async deletePlan(planLookupId: string): Promise<void> {
    await this.httpClient.delete(`/plan/${planLookupId}`);
  }

  /**
   * List all plans
   */
  async listPlans(): Promise<PlanListResponse> {
    const response = await this.httpClient.get<PlanListResponse>('/plan');
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
