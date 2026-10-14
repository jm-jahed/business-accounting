import type { LoginInput } from '@accounting/contracts';

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
};
