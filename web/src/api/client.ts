import type {
  SSOProvider,
  SSOProviderListItem,
  SSOProviderCreate,
  FieldAccount,
  FieldAccountCreate,
  FieldAccountUpdate,
  AuthCookieRequest,
  AuthCookieResponse,
  CacheStats,
  SuccessResponse,
  UserRoleResponse,
} from '../types';

const API_BASE = '/api';

// 从 localStorage 获取 API Key
const getApiKey = (): string => {
  return localStorage.getItem('apiKey') || '';
};

// 设置 API Key
export const setApiKey = (key: string): void => {
  localStorage.setItem('apiKey', key);
};

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

// ==================== Providers API ====================

export const providersApi = {
  list: () => request<SSOProviderListItem[]>('/providers'),
  
  get: (id: string) => request<SSOProvider>(`/providers/${id}`),
  
  create: (data: SSOProviderCreate) =>
    request<SSOProvider>('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<SSOProviderCreate>) =>
    request<SSOProvider>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<SuccessResponse>(`/providers/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== Fields API ====================

export const fieldsApi = {
  list: (providerId: string) =>
    request<FieldAccount[]>(`/providers/${providerId}/fields`),
  
  get: (providerId: string, key: string) =>
    request<FieldAccount>(`/providers/${providerId}/fields/${key}`),
  
  create: (providerId: string, data: FieldAccountCreate) =>
    request<FieldAccount>(`/providers/${providerId}/fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (providerId: string, key: string, data: FieldAccountUpdate) =>
    request<FieldAccount>(`/providers/${providerId}/fields/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (providerId: string, key: string) =>
    request<SuccessResponse>(`/providers/${providerId}/fields/${key}`, {
      method: 'DELETE',
    }),
};

// ==================== Auth API ====================

export const authApi = {
  getCookie: (data: AuthCookieRequest) =>
    request<AuthCookieResponse>('/auth/cookie', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getRole: () => request<UserRoleResponse>('/auth/role'),
};

// ==================== Cache API ====================

export const cacheApi = {
  getStats: () => request<CacheStats>('/cache/stats'),
  
  clear: () =>
    request<SuccessResponse>('/cache', {
      method: 'DELETE',
    }),
  
  clearProvider: (providerId: string) =>
    request<SuccessResponse>(`/cache/${providerId}`, {
      method: 'DELETE',
    }),
  
  clearField: (providerId: string, key: string) =>
    request<SuccessResponse>(`/cache/${providerId}/${key}`, {
      method: 'DELETE',
    }),
};
