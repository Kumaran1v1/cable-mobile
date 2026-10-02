import apiClient from './client';
import { DashboardSummaryData } from '../types/dashboard.types';

export const dashboardApi = {
  getSummary: async (year?: string, month?: string): Promise<{ success: boolean; data: DashboardSummaryData }> => {
    const params: Record<string, string> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const res = await apiClient.get<{ success: boolean; data: DashboardSummaryData }>('/dashboard/summary', { params });
    return res.data;
  },
};

export default dashboardApi;
