export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'ADMIN' | 'COLLECTION_AGENT' | 'STAFF' | string;
  companyName?: string;
  age?: number | null;
  gender?: string | null;
  profileImage?: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token: string;
  user: UserProfile;
}
