export interface CreateCheckoutSessionRequest {
  amount: number;
  currency?: string;
}

export interface CreateCheckoutSessionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface BalanceResponse {
  success: boolean;
  data?: {
    available: Array<{
      amount: number;
      currency: string;
      sourceTypes: Record<string, number>;
    }>;
    pending: Array<{
      amount: number;
      currency: string;
      sourceTypes: Record<string, number>;
    }>;
    totalAvailable: number;
    totalPending: number;
  };
  error?: string;
}
