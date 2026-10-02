import apiClient from './client';
import { UserProfile } from '../types/auth.types';

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  mobile?: string;
  companyName?: string;
  age?: number;
  gender?: string;
  profileImage?: string;
  password?: string;
}

export const userApi = {
  getProfile: async (): Promise<{ success: boolean; data: UserProfile }> => {
    const res = await apiClient.get<{ success: boolean; data: UserProfile }>('/auth/profile');
    return res.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<{ success: boolean; message: string; data: UserProfile }> => {
    const res = await apiClient.put<{ success: boolean; message: string; data: UserProfile }>('/auth/profile', payload);
    return res.data;
  },
};

export default userApi;
