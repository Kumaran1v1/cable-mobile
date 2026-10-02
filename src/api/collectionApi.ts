import apiClient from './client';
import {
  Customer,
  CreateCustomerPayload,
  MonthlyEntry,
  SaveMonthlyEntryPayload,
  CustomerHistoryResponse,
  YearGridResponse,
} from '../types/collection.types';

export const collectionApi = {
  // Fetch customers with status for a specific month
  getCustomers: async (month?: string, search?: string): Promise<{ data: Customer[]; count: number }> => {
    const params: Record<string, string> = {};
    if (month) params.month = month;
    if (search) params.search = search;
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  // Fetch full 12-month year grid
  getYearGrid: async (year: string, search?: string): Promise<YearGridResponse> => {
    const params: Record<string, string> = { year };
    if (search) params.search = search;
    const response = await apiClient.get<YearGridResponse>('/customers', { params });
    return response.data;
  },

  // Create new customer
  createCustomer: async (payload: CreateCustomerPayload): Promise<{ data: Customer; message: string }> => {
    const response = await apiClient.post('/customers', payload);
    return response.data;
  },

  // Update existing customer
  updateCustomer: async (id: string, payload: Partial<Customer>): Promise<{ data: Customer }> => {
    const response = await apiClient.put(`/customers/${id}`, payload);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  // Save or update monthly entry
  saveMonthlyEntry: async (
    payload: SaveMonthlyEntryPayload
  ): Promise<{ data: MonthlyEntry; isExisting: boolean; message: string }> => {
    const response = await apiClient.post('/monthly-entries', payload);
    return response.data;
  },

  // Delete monthly entry
  deleteMonthlyEntry: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/monthly-entries/${id}`);
    return response.data;
  },

  // Full history for a customer
  getCustomerHistory: async (customerId: string): Promise<CustomerHistoryResponse> => {
    const response = await apiClient.get(`/monthly-entries/customer/${customerId}`);
    return response.data;
  },
};

export default collectionApi;
