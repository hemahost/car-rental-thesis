export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  role: string;
  createdAt?: string;
  twoFactorEnabled?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  requires2FA?: boolean;
  tempToken?: string;
  token?: string;
  user?: User;
}
