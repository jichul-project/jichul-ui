export type SubscriptionType = "MONTHLY" | "YEARLY";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  type: SubscriptionType;
  providerId: string;
  providerName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  totalCount: number;
  monthlyCount: number;
  yearlyCount: number;
  monthlyTotal: number;
  yearlyTotal: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  userId: string;
  email: string;
  name: string;
}
