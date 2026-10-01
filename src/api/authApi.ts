import apiClient from './client';
import { LoginRequest, LoginResponse, UserProfile } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<{ success: boolean; data: UserProfile }>('/auth/profile');
    return response.data.data;
  },
};
