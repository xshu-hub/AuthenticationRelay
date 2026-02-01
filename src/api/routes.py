"""
API 路由定义
"""
import logging
from enum import Enum
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Header, status

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
    SuccessResponse,
    ErrorResponse,
    CacheStatsResponse,
    UserRoleResponse,
)
from src.storage.credential import get_credential_store
from src.storage.cookie_cache import get_cookie_cache
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


# ==================== SSO Provider 路由 ====================

@router.get("/providers", response_model=list[SSOProviderListResponse], tags=["Providers"])
async def list_providers(role: UserRole = Depends(verify_api_key_with_role)):
    """列出所有 SSO 平台"""
    store = get_credential_store()
    providers = store.get_all_providers()
    
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
    
    return result


@router.post("/providers", response_model=SSOProviderResponse, tags=["Providers"])
async def create_provider(
    provider: SSOProviderCreate,
    role: UserRole = Depends(require_admin)
):
    """创建 SSO 平台（需要管理员权限）"""
    store = get_credential_store()
    
    try:
        created = store.create_provider(provider.model_dump())
        return SSOProviderResponse(**created)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/providers/{provider_id}", response_model=SSOProviderResponse, tags=["Providers"])
async def get_provider(provider_id: str, role: UserRole = Depends(verify_api_key_with_role)):
    """获取 SSO 平台详情"""
    store = get_credential_store()
    provider = store.get_provider(provider_id)
    
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    
    return SSOProviderResponse(**provider)


@router.put("/providers/{provider_id}", response_model=SSOProviderResponse, tags=["Providers"])
async def update_provider(
    provider_id: str,
    provider: SSOProviderUpdate,
    role: UserRole = Depends(require_admin)
):
    """更新 SSO 平台（需要管理员权限）"""
    store = get_credential_store()
    
    updated = store.update_provider(provider_id, provider.model_dump(exclude_unset=True))
    
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    
    return SSOProviderResponse(**updated)


@router.delete("/providers/{provider_id}", response_model=SuccessResponse, tags=["Providers"])
async def delete_provider(
    provider_id: str,
    role: UserRole = Depends(require_admin)
):
    """删除 SSO 平台（需要管理员权限）"""
    store = get_credential_store()
    cache = get_cookie_cache()
    
    if store.delete_provider(provider_id):
        # 同时清除相关缓存
        cache.invalidate_provider(provider_id)
        return SuccessResponse(message=f"Provider '{provider_id}' deleted")
    
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
    fields = store.get_fields(provider_id)
    
    if fields is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    
    return [FieldAccountResponse(**f) for f in fields]


@router.post(
    "/providers/{provider_id}/fields",
    response_model=FieldAccountResponse,
    tags=["Fields"]
)
async def create_field(
    provider_id: str,
    field: FieldAccountCreate,
    role: UserRole = Depends(verify_api_key_with_role)
):
    """创建字段账号"""
    store = get_credential_store()
    
    try:
        created = store.create_field(provider_id, field.model_dump())
        if created is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
        return FieldAccountResponse(**created)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/providers/{provider_id}/fields/{key}",
    response_model=FieldAccountResponse,
    tags=["Fields"]
)
async def get_field(provider_id: str, key: str, role: UserRole = Depends(verify_api_key_with_role)):
    """获取字段详情"""
    store = get_credential_store()
    field = store.get_field(provider_id, key)
    
    if field is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")
    
    return FieldAccountResponse(**field)


@router.put(
    "/providers/{provider_id}/fields/{key}",
    response_model=FieldAccountResponse,
    tags=["Fields"]
)
async def update_field(
    provider_id: str,
    key: str,
    field: FieldAccountUpdate,
    role: UserRole = Depends(verify_api_key_with_role)
):
    """更新字段账号"""
    store = get_credential_store()
    cache = get_cookie_cache()
    
    updated = store.update_field(provider_id, key, field.model_dump(exclude_unset=True))
    
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")
    
    # 清除相关缓存（凭证变更后需要重新认证）
    cache.invalidate(provider_id, key)
    
    return FieldAccountResponse(**updated)


@router.delete(
    "/providers/{provider_id}/fields/{key}",
    response_model=SuccessResponse,
    tags=["Fields"]
)
async def delete_field(provider_id: str, key: str, role: UserRole = Depends(verify_api_key_with_role)):
    """删除字段账号"""
    store = get_credential_store()
    cache = get_cookie_cache()
    
    if store.delete_field(provider_id, key):
        cache.invalidate(provider_id, key)
        return SuccessResponse(message=f"Field '{key}' deleted")
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field not found")


# ==================== 认证路由 ====================

@router.post("/auth/cookie", response_model=AuthCookieResponse, tags=["Auth"])
async def get_auth_cookie(request: AuthCookieRequest, role: UserRole = Depends(verify_api_key_with_role)):
    """
    获取认证 Cookie
    
    会自动检查缓存并验证有效性，失效时自动重新认证
    """
    service = get_auth_service()
    
    try:
        cookies = await service.get_cookie(request.provider_id, request.key)
        
        return AuthCookieResponse(
            provider_id=request.provider_id,
            key=request.key,
            cookies=cookies,
        )
    except AuthenticationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"认证失败: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== 缓存管理路由 ====================

@router.get("/cache/stats", response_model=CacheStatsResponse, tags=["Cache"])
async def get_cache_stats(role: UserRole = Depends(verify_api_key_with_role)):
    """获取缓存统计信息"""
    cache = get_cookie_cache()
    return CacheStatsResponse(**cache.get_stats())


@router.delete("/cache", response_model=SuccessResponse, tags=["Cache"])
async def clear_cache(role: UserRole = Depends(verify_api_key_with_role)):
    """清空所有缓存"""
    cache = get_cookie_cache()
    count = cache.clear()
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
