import type {
  LoginInput,
  AccountResponseDto,
  CreateAccountInput,
  UpdateAccountInput,
  AccountType,
  DashboardSummaryResponseDto,
  DashboardKPICard,
  DashboardQueryFilter,
} from '@accounting/contracts';

export type {
  DashboardSummaryResponseDto,
  DashboardKPICard,
  DashboardQueryFilter,
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  status: string;
}

export interface AuthCompany {
  companyId: string;
  name: string;
  slug: string;
  legalName?: string;
  currency: string;
  countryCode: string;
  industryType?: string;
  enabledModules: string[];
  role: string;
  branchAccess: string[] | 'all';
}

export interface MeResponse {
  user: AuthUser;
  companies: AuthCompany[];
}

export interface ApiClientOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return '/api';
    }
  }
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
  const cleaned = rawUrl.replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('csrf_token='));
  return match ? decodeURIComponent(match.substring('csrf_token='.length)) : null;
}

let activeRefreshPromise: Promise<boolean> | null = null;

/**
 * Universal browser API client for the Universal Business Accounting System.
 * - Enforces credentials: 'include' (HttpOnly cookies).
 * - Transmits x-client-type: web header.
 * - Injects x-csrf-token on mutating requests.
 * - Handles 401 automatic refresh deduplication without infinite loops.
 * - Never stores tokens in localStorage or sessionStorage.
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  headers.set('x-client-type', 'web');
  headers.set('Accept', 'application/json');

  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Double-submit CSRF enforcement on state-mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers.has('x-csrf-token')) {
      headers.set('x-csrf-token', csrfToken);
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  // Handle 401 Unauthorized with single in-flight token refresh
  const isAuthRoute =
    normalizedEndpoint.includes('/auth/login') ||
    normalizedEndpoint.includes('/auth/refresh') ||
    normalizedEndpoint.includes('/auth/logout');

  if (response.status === 401 && !isAuthRoute && options.retryOnUnauthorized !== false) {
    if (!activeRefreshPromise) {
      activeRefreshPromise = (async () => {
        try {
          const csrf = getCsrfTokenFromCookie();
          const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-client-type': 'web',
              ...(csrf ? { 'x-csrf-token': csrf } : {}),
            },
          });
          return refreshRes.ok;
        } catch {
          return false;
        } finally {
          activeRefreshPromise = null;
        }
      })();
    }

    const refreshSuccess = await activeRefreshPromise;
    if (refreshSuccess) {
      // Retry original request exactly once
      return apiClient<T>(endpoint, {
        ...options,
        retryOnUnauthorized: false,
      });
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    let errorDetails: any = null;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorMessage;
      errorDetails = errorJson;
    } catch {
      // Non-JSON error body fallback
    }
    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Auth API operations
 */
export const authApi = {
  async login(credentials: LoginInput): Promise<any> {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      retryOnUnauthorized: false,
    });
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    return apiClient('/auth/logout', {
      method: 'POST',
      retryOnUnauthorized: false,
    });
  },

  async getMe(): Promise<MeResponse> {
    return apiClient('/auth/me', {
      method: 'GET',
    });
  },

  async refresh(): Promise<boolean> {
    try {
      await apiClient('/auth/refresh', {
        method: 'POST',
        retryOnUnauthorized: false,
      });
      return true;
    } catch {
      return false;
    }
  },

  async loginWithGoogle(idToken: string): Promise<any> {
    return apiClient('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      retryOnUnauthorized: false,
    });
  },

  async linkGoogleAccount(idToken: string, password: string): Promise<any> {
    return apiClient('/auth/google/link', {
      method: 'POST',
      body: JSON.stringify({ idToken, password }),
      retryOnUnauthorized: false,
    });
  },
};

/**
 * Chart of Accounts API operations
 */
export const accountsApi = {
  async list(
    companyId: string,
    params?: { type?: AccountType; isActive?: boolean; search?: string; limit?: number }
  ): Promise<AccountResponseDto[]> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params?.search) query.set('search', params.search);
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    const endpoint = `/companies/${companyId}/accounts${qs ? `?${qs}` : ''}`;
    return apiClient<AccountResponseDto[]>(endpoint, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async getById(companyId: string, accountId: string): Promise<AccountResponseDto> {
    return apiClient<AccountResponseDto>(`/companies/${companyId}/accounts/${accountId}`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async create(companyId: string, input: CreateAccountInput): Promise<AccountResponseDto> {
    return apiClient<AccountResponseDto>(`/companies/${companyId}/accounts`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(input),
    });
  },

  async update(
    companyId: string,
    accountId: string,
    input: UpdateAccountInput
  ): Promise<AccountResponseDto> {
    return apiClient<AccountResponseDto>(`/companies/${companyId}/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(input),
    });
  },

  async deactivate(companyId: string, accountId: string): Promise<AccountResponseDto> {
    return apiClient<AccountResponseDto>(`/companies/${companyId}/accounts/${accountId}`, {
      method: 'DELETE',
      headers: { 'x-company-id': companyId },
    });
  },

  async initializeStandard(
    companyId: string
  ): Promise<{ message: string; createdCount: number }> {
    return apiClient<{ message: string; createdCount: number }>(
      `/companies/${companyId}/accounts/initialize`,
      {
        method: 'POST',
        headers: { 'x-company-id': companyId },
      }
    );
  },
};

/**
 * Enterprise Inventory & Warehouse API operations
 */
export const inventoryApi = {
  async getOverview(companyId: string): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/overview`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async initStandard(companyId: string): Promise<{ success: boolean; message: string; data: any }> {
    return apiClient(`/companies/${companyId}/inventory/init-standard`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
    });
  },

  async listUoms(companyId: string): Promise<any[]> {
    return apiClient(`/companies/${companyId}/inventory/uoms`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async createUom(companyId: string, data: any): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/uoms`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(data),
    });
  },

  async listCategories(companyId: string): Promise<any[]> {
    return apiClient(`/companies/${companyId}/inventory/categories`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async createCategory(companyId: string, data: any): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/categories`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(data),
    });
  },

  async listBrands(companyId: string): Promise<any[]> {
    return apiClient(`/companies/${companyId}/inventory/brands`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async createBrand(companyId: string, data: any): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/brands`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(data),
    });
  },

  async listWarehouses(companyId: string): Promise<any[]> {
    return apiClient(`/companies/${companyId}/inventory/warehouses`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async createWarehouse(companyId: string, data: any): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/warehouses`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(data),
    });
  },

  async listBins(companyId: string, warehouseId: string): Promise<any[]> {
    return apiClient(`/companies/${companyId}/inventory/warehouses/${warehouseId}/bins`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async createBin(companyId: string, data: any): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/bins`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(data),
    });
  },

  async listItems(
    companyId: string,
    params?: { search?: string; categoryId?: string; type?: string; limit?: number; offset?: number }
  ): Promise<{ items: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.type) query.set('type', params.type);
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString();
    return apiClient(`/companies/${companyId}/inventory/items${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async getItem(companyId: string, id: string): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/items/${id}`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async createItem(companyId: string, data: any): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/items`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(data),
    });
  },

  async getStockBalances(
    companyId: string,
    params?: { warehouseId?: string; itemId?: string }
  ): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.warehouseId) query.set('warehouseId', params.warehouseId);
    if (params?.itemId) query.set('itemId', params.itemId);
    const qs = query.toString();
    return apiClient(`/companies/${companyId}/inventory/stock-balances${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async listTransfers(companyId: string): Promise<any[]> {
    return apiClient(`/companies/${companyId}/inventory/transfers`, {
      method: 'GET',
      headers: { 'x-company-id': companyId },
    });
  },

  async createTransfer(companyId: string, data: any): Promise<any> {
    return apiClient(`/companies/${companyId}/inventory/transfers`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify(data),
    });
  },
};

export const dashboardApi = {
  async getSummary(
    companyId: string,
    params?: DashboardQueryFilter
  ): Promise<DashboardSummaryResponseDto> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.compareTo) query.set('compareTo', params.compareTo);
    if (params?.branchId) query.set('branchId', params.branchId);
    if (params?.currency) query.set('currency', params.currency);
    const qs = query.toString();
    return apiClient<DashboardSummaryResponseDto>(
      `/companies/${companyId}/dashboard/summary${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        headers: { 'x-company-id': companyId },
      }
    );
  },

  async seedDemo(companyId: string): Promise<{ success: boolean; message: string; seededEntriesCount: number }> {
    return apiClient<{ success: boolean; message: string; seededEntriesCount: number }>(
      `/companies/${companyId}/dashboard/seed-demo`,
      {
        method: 'POST',
        headers: { 'x-company-id': companyId },
      }
    );
  },
};

