"""
API 路由定义
"""
import logging
from datetime import datetime
from enum import Enum
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header, Request, Query, status

from src.api.models import (
    SSOProviderCreate,
    SSOProviderUpdate,
    SSOProviderResponse,
    SSOProviderListResponse,
    FieldAccountCreate,
    FieldAccountUpdate,
    FieldAccountResponse,
    AuthCookieRequest,
    AuthCookieResponse,
    CookieItem,
    SuccessResponse,
    ErrorResponse,
    CacheStatsResponse,
    UserRoleResponse,
    AuditLogResponse,
    AuditLogListResponse,
    AuditLogStatsResponse,
)
from src.storage.credential import get_credential_store
from src.storage.cookie_cache import get_cookie_cache
from src.storage.audit_log import get_audit_log_service, AuditAction, ResourceType
from src.auth.engine import get_auth_service, AuthenticationError
from src.utils.config import get_config

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== 用户角色定义 ====================

class UserRole(str, Enum):
    """用户角色"""
    ADMIN = "admin"
    USER = "user"


# ==================== API Key 认证 ====================

async def verify_api_key_with_role(
    x_api_key: Annotated[str | None, Header()] = None
) -> UserRole:
    """验证 API Key 并返回用户角色"""
    config = get_config()
    
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key"
        )
    
    # 检查是否匹配 admin key
    if x_api_key == config.api_keys.admin:
        return UserRole.ADMIN
    
    # 检查是否匹配 user key
    if x_api_key == config.api_keys.user:
        return UserRole.USER
    
    # 兼容旧的单 key 配置（视为 admin）
    if config.api_key and x_api_key == config.api_key:
        return UserRole.ADMIN
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key"
    )


async def require_admin(
    role: UserRole = Depends(verify_api_key_with_role)
) -> UserRole:
    """要求管理员权限"""
    if role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required"
        )
    return role


# 兼容旧的 verify_api_key 函数签名
async def verify_api_key(x_api_key: Annotated[str | None, Header()] = None) -> str:
    """验证 API Key（兼容旧接口，返回 key 字符串）"""
    role = await verify_api_key_with_role(x_api_key)
    return x_api_key  # type: ignore


def get_client_ip(request: Request) -> str:
    """获取客户端 IP 地址"""
    # 尝试从 X-Forwarded-For 头获取真实 IP
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    # 尝试从 X-Real-IP 头获取
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    # 使用直连 IP
    return request.client.host if request.client else "unknown"


# ==================== SSO Provider 路由 ====================

@router.get("/providers", response_model=list[SSOProviderListResponse], tags=["Providers"])
async def list_providers(request: Request, role: UserRole = Depends(verify_api_key_with_role)):
    """列出所有 SSO 平台"""
    store = get_credential_store()
    audit = get_audit_log_service()
    
    providers = await store.get_all_providers()
    
    result = []
    for p in providers:
        result.append(SSOProviderListResponse(
            id=p.get("id"),
            name=p.get("name"),
            login_url=p.get("login_url"),
            field_count=len(p.get("fields", [])),
            created_at=p.get("created_at"),
            updated_at=p.get("updated_at"),
        ))
    
    # 记录日志
    await audit.log(
        action=AuditAction.PROVIDER_LIST,
        resource_type=ResourceType.PROVIDER,
        user_role=role.value,
        ip_address=get_client_ip(request),
        details={"count": len(result)},
    )
    
    return result


@router.post("/providers", response_model=SSOProviderResponse, tags=["Providers"])
async def create_provider(
    request: Request,
    provider: SSOProviderCreate,
    role: UserRole = Depends(require_admin)
):
    """创建 SSO 平台（需要管理员权限）"""
    store = get_credential_store()
    audit = get_audit_log_service()
    ip = get_client_ip(request)
    
    try:
        created = await store.create_provider(provider.model_dump())
        
        # 记录成功日志
        await audit.log(
            action=AuditAction.PROVIDER_CREATE,
            resource_type=ResourceType.PROVIDER,
            resource_id=provider.id,
            user_role=role.value,
            ip_address=ip,
            details={"name": provider.name},
        )
        
        return SSOProviderResponse(**created)
    except ValueError as e:
        # 记录失败日志
        await audit.log(
            action=AuditAction.PROVIDER_CREATE,
            resource_type=ResourceType.PROVIDER,
            resource_id=provider.id,
            user_role=role.value,
            ip_address=ip,
            details={"error": str(e)},
            success=False,
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/providers/{provider_id}", response_model=SSOProviderResponse, tags=["Providers"])
async def get_provider(provider_id: str, role: UserRole = Depends(verify_api_key_with_role)):
    """获取 SSO 平台详情"""
    store = get_credential_store()
    provider = await store.get_provider(provider_id)
    
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    
    return SSOProviderResponse(**provider)


@router.put("/providers/{provider_id}", response_model=SSOProviderResponse, tags=["Providers"])
async def update_provider(
    request: Request,
    provider_id: str,
    provider: SSOProviderUpdate,
    role: UserRole = Depends(require_admin)
):
    """更新 SSO 平台（需要管理员权限）"""
    store = get_credential_store()
    audit = get_audit_log_service()
    ip = get_client_ip(request)
    
    updated = await store.update_provider(provider_id, provider.model_dump(exclude_unset=True))
    
    if not updated:
        await audit.log(
            action=AuditAction.PROVIDER_UPDATE,
            resource_type=ResourceType.PROVIDER,
            resource_id=provider_id,
            user_role=role.value,
            ip_address=ip,
            details={"error": "Provider not found"},
            success=False,
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    
    await audit.log(
        action=AuditAction.PROVIDER_UPDATE,
        resource_type=ResourceType.PROVIDER,
        resource_id=provider_id,
        user_role=role.value,
        ip_address=ip,
        details={"updated_fields": list(provider.model_dump(exclude_unset=True).keys())},
    )
    
    return SSOProviderResponse(**updated)


@router.delete("/providers/{provider_id}", response_model=SuccessResponse, tags=["Providers"])
async def delete_provider(
    request: Request,
    provider_id: str,
    role: UserRole = Depends(require_admin)
):
    """删除 SSO 平台（需要管理员权限）"""
    store = get_credential_store()
    cache = get_cookie_cache()
    audit = get_audit_log_service()
    ip = get_client_ip(request)
    
    if await store.delete_provider(provider_id):
        # 同时清除相关缓存
        cache.invalidate_provider(provider_id)
        
        await audit.log(
            action=AuditAction.PROVIDER_DELETE,
            resource_type=ResourceType.PROVIDER,
            resource_id=provider_id,
            user_role=role.value,
            ip_address=ip,
        )
        
        return SuccessResponse(message=f"Provider '{provider_id}' deleted")
    
    await audit.log(
        action=AuditAction.PROVIDER_DELETE,
        resource_type=ResourceType.PROVIDER,
        resource_id=provider_id,
        user_role=role.value,
        ip_address=ip,
        details={"error": "Provider not found"},
        success=False,
    )
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")


# ==================== Field 路由 ====================

@router.get(
    "/providers/{provider_id}/fields",
    response_model=list[FieldAccountResponse],
    tags=["Fields"]
)
async def list_fields(provider_id: str, role: UserRole = Depends(verify_api_key_with_role)):
    """列出平台下所有字段"""
    store = get_credential_store()
    fields = await store.get_fields(provider_id)
    
    if fields is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    
    return [FieldAccountResponse(**f) for f in fields]


@router.post(
    "/providers/{provider_id}/fields",
    response_model=FieldAccountResponse,
    tags=["Fields"]
)
async def create_field(
    request: Request,
    provider_id: str,
    field: FieldAccountCreate,
    role: UserRole = Depends(verify_api_key_with_role)
):
    """创建字段账号"""
    store = get_credential_store()
    audit = get_audit_log_service()
    ip = get_client_ip(request)
    
    try:
        created = await store.create_field(provider_id, field.model_dump())
        if created is None:
            await audit.log(
                action=AuditAction.FIELD_CREATE,
                resource_type=ResourceType.FIELD,
                resource_id=f"{provider_id}/{field.key}",
                user_role=role.value,
                ip_address=ip,
                details={"error": "Provider not found"},
                success=False,
            )
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
        
        await audit.log(
            action=AuditAction.FIELD_CREATE,
            resource_type=ResourceType.FIELD,
            resource_id=f"{provider_id}/{field.key}",
            user_role=role.value,
            ip_address=ip,
            details={"username": field.username},
        )
        
        return FieldAccountResponse(**created)
    except ValueError as e:
        await audit.log(
            action=AuditAction.FIELD_CREATE,
            resource_type=ResourceType.FIELD,
            resource_id=f"{provider_id}/{field.key}",
            user_role=role.value,
            ip_address=ip,
            details={"error": str(e)},
            success=False,
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/providers/{provider_id}/fields/{key}",
    response_model=FieldAccountResponse,
    tags=["Fields"]
)
async def get_field(provider_id: str, key: str, role: UserRole = Depends(verify_api_key_with_role)):
    """获取字段详情"""
    store = get_credential_store()
    field = await store.get_field(provider_id, key)
    
    if field is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")
    
    return FieldAccountResponse(**field)


@router.put(
    "/providers/{provider_id}/fields/{key}",
    response_model=FieldAccountResponse,
    tags=["Fields"]
)
async def update_field(
    request: Request,
    provider_id: str,
    key: str,
    field: FieldAccountUpdate,
    role: UserRole = Depends(verify_api_key_with_role)
):
    """更新字段账号"""
    store = get_credential_store()
    cache = get_cookie_cache()
    audit = get_audit_log_service()
    ip = get_client_ip(request)
    
    updated = await store.update_field(provider_id, key, field.model_dump(exclude_unset=True))
    
    if updated is None:
        await audit.log(
            action=AuditAction.FIELD_UPDATE,
            resource_type=ResourceType.FIELD,
            resource_id=f"{provider_id}/{key}",
            user_role=role.value,
            ip_address=ip,
            details={"error": "Field not found"},
            success=False,
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")
    
    # 清除相关缓存（凭证变更后需要重新认证）
    cache.invalidate(provider_id, key)
    
    await audit.log(
        action=AuditAction.FIELD_UPDATE,
        resource_type=ResourceType.FIELD,
        resource_id=f"{provider_id}/{key}",
        user_role=role.value,
        ip_address=ip,
        details={"updated_fields": list(field.model_dump(exclude_unset=True).keys())},
    )
    
    return FieldAccountResponse(**updated)


@router.delete(
    "/providers/{provider_id}/fields/{key}",
    response_model=SuccessResponse,
    tags=["Fields"]
)
async def delete_field(
    request: Request,
    provider_id: str,
    key: str,
    role: UserRole = Depends(verify_api_key_with_role)
):
    """删除字段账号"""
    store = get_credential_store()
    cache = get_cookie_cache()
    audit = get_audit_log_service()
    ip = get_client_ip(request)
    
    if await store.delete_field(provider_id, key):
        cache.invalidate(provider_id, key)
        
        await audit.log(
            action=AuditAction.FIELD_DELETE,
            resource_type=ResourceType.FIELD,
            resource_id=f"{provider_id}/{key}",
            user_role=role.value,
            ip_address=ip,
        )
        
        return SuccessResponse(message=f"Field '{key}' deleted")
    
    await audit.log(
        action=AuditAction.FIELD_DELETE,
        resource_type=ResourceType.FIELD,
        resource_id=f"{provider_id}/{key}",
        user_role=role.value,
        ip_address=ip,
        details={"error": "Field not found"},
        success=False,
    )
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")


# ==================== 认证路由 ====================

@router.post("/auth/cookie", response_model=AuthCookieResponse, tags=["Auth"])
async def get_auth_cookie(
    http_request: Request,
    request: AuthCookieRequest,
    role: UserRole = Depends(verify_api_key_with_role)
):
    """
    获取认证 Cookie
    
    会自动检查缓存并验证有效性，失效时自动重新认证
    """
    service = get_auth_service()
    audit = get_audit_log_service()
    ip = get_client_ip(http_request)
    
    await audit.log(
        action=AuditAction.AUTH_REQUEST,
        resource_type=ResourceType.AUTH,
        resource_id=f"{request.provider_id}/{request.key}",
        user_role=role.value,
        ip_address=ip,
    )
    
    try:
        cookies = await service.get_cookie(request.provider_id, request.key)
        
        await audit.log(
            action=AuditAction.AUTH_SUCCESS,
            resource_type=ResourceType.AUTH,
            resource_id=f"{request.provider_id}/{request.key}",
            user_role=role.value,
            ip_address=ip,
            details={"cookie_count": len(cookies)},
        )
        
        return AuthCookieResponse(
            provider_id=request.provider_id,
            key=request.key,
            cookies=cookies,
        )
    except AuthenticationError as e:
        await audit.log(
            action=AuditAction.AUTH_FAILURE,
            resource_type=ResourceType.AUTH,
            resource_id=f"{request.provider_id}/{request.key}",
            user_role=role.value,
            ip_address=ip,
            details={"error": str(e)},
            success=False,
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"认证失败: {e}")
        await audit.log(
            action=AuditAction.AUTH_FAILURE,
            resource_type=ResourceType.AUTH,
            resource_id=f"{request.provider_id}/{request.key}",
            user_role=role.value,
            ip_address=ip,
            details={"error": str(e)},
            success=False,
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== 缓存管理路由 ====================

@router.get("/cache/stats", response_model=CacheStatsResponse, tags=["Cache"])
async def get_cache_stats(role: UserRole = Depends(verify_api_key_with_role)):
    """获取缓存统计信息"""
    cache = get_cookie_cache()
    return CacheStatsResponse(**cache.get_stats())


@router.delete("/cache", response_model=SuccessResponse, tags=["Cache"])
async def clear_cache(request: Request, role: UserRole = Depends(verify_api_key_with_role)):
    """清空所有缓存"""
    cache = get_cookie_cache()
    audit = get_audit_log_service()
    
    count = cache.clear()
    
    await audit.log(
        action=AuditAction.CACHE_CLEAR,
        resource_type=ResourceType.CACHE,
        user_role=role.value,
        ip_address=get_client_ip(request),
        details={"cleared_count": count},
    )
    
    return SuccessResponse(message=f"Cleared {count} cache entries")


@router.delete("/cache/{provider_id}", response_model=SuccessResponse, tags=["Cache"])
async def clear_provider_cache(provider_id: str, role: UserRole = Depends(verify_api_key_with_role)):
    """清空指定平台的缓存"""
    cache = get_cookie_cache()
    count = cache.invalidate_provider(provider_id)
    return SuccessResponse(message=f"Cleared {count} cache entries for provider '{provider_id}'")


@router.delete("/cache/{provider_id}/{key}", response_model=SuccessResponse, tags=["Cache"])
async def clear_field_cache(
    provider_id: str,
    key: str,
    role: UserRole = Depends(verify_api_key_with_role)
):
    """清空指定字段的缓存"""
    cache = get_cookie_cache()
    if cache.invalidate(provider_id, key):
        return SuccessResponse(message=f"Cache cleared for '{provider_id}/{key}'")
    return SuccessResponse(message="No cache found")


# ==================== 用户角色路由 ====================

@router.get("/auth/role", response_model=UserRoleResponse, tags=["Auth"])
async def get_user_role(role: UserRole = Depends(verify_api_key_with_role)):
    """获取当前用户角色"""
    return UserRoleResponse(role=role.value)


# ==================== 审计日志路由 ====================

@router.get("/logs", response_model=AuditLogListResponse, tags=["Logs"])
async def list_logs(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    action: str | None = Query(None, description="按操作类型筛选"),
    resource_type: str | None = Query(None, description="按资源类型筛选"),
    resource_id: str | None = Query(None, description="按资源 ID 筛选"),
    success: bool | None = Query(None, description="按成功状态筛选"),
    start_time: datetime | None = Query(None, description="开始时间"),
    end_time: datetime | None = Query(None, description="结束时间"),
    role: UserRole = Depends(require_admin)
):
    """查询审计日志（需要管理员权限）"""
    audit = get_audit_log_service()
    
    result = await audit.get_logs(
        page=page,
        page_size=page_size,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        success=success,
        start_time=start_time,
        end_time=end_time,
    )
    
    return AuditLogListResponse(**result)


@router.get("/logs/stats", response_model=AuditLogStatsResponse, tags=["Logs"])
async def get_logs_stats(
    start_time: datetime | None = Query(None, description="统计开始时间"),
    end_time: datetime | None = Query(None, description="统计结束时间"),
    role: UserRole = Depends(require_admin)
):
    """获取日志统计信息（需要管理员权限）"""
    audit = get_audit_log_service()
    
    result = await audit.get_stats(
        start_time=start_time,
        end_time=end_time,
    )
    
    return AuditLogStatsResponse(**result)
