// 用户角色类型
export type UserRole = 'admin' | 'user';

export interface UserRoleResponse {
  role: UserRole;
}

// SSO Provider 类型
export interface FieldAccount {
  key: string;
  username: string;
  created_at?: string;
  updated_at?: string;
}

export interface FieldAccountCreate {
  key: string;
  username: string;
  password: string;
}

export interface FieldAccountUpdate {
  username?: string;
  password?: string;
}

export interface SSOProvider {
  id: string;
  name: string;
  login_url: string;
  username_selector: string;
  password_selector: string;
  submit_selector: string;
  success_indicator?: string;
  success_indicator_type: 'url_contains' | 'url_equals' | 'element_exists';
  validate_url?: string;
  invalid_indicator?: string;
  invalid_indicator_type: 'status_code' | 'url_contains' | 'element_exists';
  wait_after_login: number;
  fields: FieldAccount[];
  created_at?: string;
  updated_at?: string;
}

export interface SSOProviderListItem {
  id: string;
  name: string;
  login_url: string;
  field_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface SSOProviderCreate {
  id: string;
  name: string;
  login_url: string;
  username_selector: string;
  password_selector: string;
  submit_selector: string;
  success_indicator?: string;
  success_indicator_type?: 'url_contains' | 'url_equals' | 'element_exists';
  validate_url?: string;
  invalid_indicator?: string;
  invalid_indicator_type?: 'status_code' | 'url_contains' | 'element_exists';
  wait_after_login?: number;
}

// 认证相关
export interface AuthCookieRequest {
  provider_id: string;
  key: string;
}

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface AuthCookieResponse {
  provider_id: string;
  key: string;
  cookies: CookieItem[];
  from_cache: boolean;
}

// 缓存统计
export interface CacheStats {
  total_entries: number;
  providers: Record<string, {
    count: number;
    entries: Array<{
      key: string;
      created_at: string;
      last_validated_at?: string;
      validation_count: number;
    }>;
  }>;
}

// API 响应
export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  detail?: string;
}

// 审计日志
export interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  user_role?: string;
  ip_address?: string;
  details?: Record<string, unknown>;
  success: boolean;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuditLogStats {
  total: number;
  success_count: number;
  failure_count: number;
  by_action: Record<string, number>;
  by_resource_type: Record<string, number>;
  by_role: Record<string, number>;
}

export interface LogQueryParams {
  page?: number;
  page_size?: number;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  success?: boolean;
  start_time?: string;
  end_time?: string;
}
