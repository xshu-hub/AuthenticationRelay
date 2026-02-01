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

export interface AuthCookieResponse {
  provider_id: string;
  key: string;
  cookies: Record<string, string>;
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
