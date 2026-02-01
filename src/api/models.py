"""
API 数据模型
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ==================== 字段账号模型 ====================

class FieldAccountBase(BaseModel):
    """字段账号基础模型"""
    key: str = Field(..., description="字段标识")
    username: str = Field(..., description="登录用户名")


class FieldAccountCreate(FieldAccountBase):
    """创建字段账号"""
    password: str = Field(..., description="登录密码")


class FieldAccountUpdate(BaseModel):
    """更新字段账号"""
    username: str | None = Field(None, description="登录用户名")
    password: str | None = Field(None, description="登录密码")


class FieldAccountResponse(FieldAccountBase):
    """字段账号响应（不含密码）"""
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ==================== SSO 平台模型 ====================

class SSOProviderBase(BaseModel):
    """SSO 平台基础模型"""
    id: str = Field(..., description="平台 ID")
    name: str = Field(..., description="平台名称")
    login_url: str = Field(..., description="登录页面 URL")
    username_selector: str = Field(..., description="用户名输入框选择器")
    password_selector: str = Field(..., description="密码输入框选择器")
    submit_selector: str = Field(..., description="登录按钮选择器")
    
    # 登录成功判断
    success_indicator: str | None = Field(None, description="成功标识")
    success_indicator_type: Literal["url_contains", "url_equals", "element_exists"] = Field(
        "url_contains", description="成功标识类型"
    )
    
    # Cookie 验证配置
    validate_url: str | None = Field(None, description="验证 Cookie 的 URL")
    invalid_indicator: str | None = Field(None, description="失效标识")
    invalid_indicator_type: Literal["status_code", "url_contains", "element_exists"] = Field(
        "url_contains", description="失效标识类型"
    )
    
    # 可选配置
    wait_after_login: int = Field(2000, description="登录后等待时间(ms)")


class SSOProviderCreate(SSOProviderBase):
    """创建 SSO 平台"""
    pass


class SSOProviderUpdate(BaseModel):
    """更新 SSO 平台"""
    name: str | None = None
    login_url: str | None = None
    username_selector: str | None = None
    password_selector: str | None = None
    submit_selector: str | None = None
    success_indicator: str | None = None
    success_indicator_type: Literal["url_contains", "url_equals", "element_exists"] | None = None
    validate_url: str | None = None
    invalid_indicator: str | None = None
    invalid_indicator_type: Literal["status_code", "url_contains", "element_exists"] | None = None
    wait_after_login: int | None = None


class SSOProviderResponse(SSOProviderBase):
    """SSO 平台响应"""
    fields: list[FieldAccountResponse] = Field(default_factory=list, description="字段列表")
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SSOProviderListResponse(BaseModel):
    """SSO 平台列表响应"""
    id: str
    name: str
    login_url: str
    field_count: int = Field(0, description="字段数量")
    created_at: datetime | None = None
    updated_at: datetime | None = None


# ==================== 认证请求模型 ====================

class AuthCookieRequest(BaseModel):
    """认证 Cookie 请求"""
    provider_id: str = Field(..., description="SSO 平台 ID")
    key: str = Field(..., description="字段标识")


class AuthCookieResponse(BaseModel):
    """认证 Cookie 响应"""
    provider_id: str
    key: str
    cookies: dict[str, str]
    from_cache: bool = Field(False, description="是否来自缓存")


# ==================== 通用响应模型 ====================

class SuccessResponse(BaseModel):
    """成功响应"""
    success: bool = True
    message: str = ""


class ErrorResponse(BaseModel):
    """错误响应"""
    success: bool = False
    error: str
    detail: str | None = None


# ==================== 缓存统计模型 ====================

class CacheStatsResponse(BaseModel):
    """缓存统计响应"""
    total_entries: int
    providers: dict


# ==================== 用户角色模型 ====================

class UserRoleResponse(BaseModel):
    """用户角色响应"""
    role: Literal["admin", "user"] = Field(..., description="用户角色")


# ==================== 审计日志模型 ====================

class AuditLogResponse(BaseModel):
    """审计日志响应"""
    id: int
    timestamp: str
    action: str
    resource_type: str
    resource_id: str | None = None
    user_role: str | None = None
    ip_address: str | None = None
    details: dict | None = None
    success: bool = True


class AuditLogListResponse(BaseModel):
    """审计日志列表响应"""
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int


class AuditLogStatsResponse(BaseModel):
    """审计日志统计响应"""
    total: int
    success_count: int
    failure_count: int
    by_action: dict[str, int]
    by_resource_type: dict[str, int]
    by_role: dict[str, int]
