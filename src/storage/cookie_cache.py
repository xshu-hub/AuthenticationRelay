"""
Cookie 缓存模块 - 内存缓存认证 Cookie
"""
from datetime import datetime
from typing import Any
from dataclasses import dataclass, field


@dataclass
class CachedCookie:
    """缓存的 Cookie 数据"""
    cookies: dict[str, str]  # Cookie 键值对
    created_at: datetime = field(default_factory=datetime.now)
    last_validated_at: datetime | None = None
    validation_count: int = 0
    
    def mark_validated(self) -> None:
        """标记为已验证"""
        self.last_validated_at = datetime.now()
        self.validation_count += 1


class CookieCache:
    """Cookie 缓存管理器"""
    
    def __init__(self):
        """初始化 Cookie 缓存"""
        # 缓存结构: {provider_id: {key: CachedCookie}}
        self._cache: dict[str, dict[str, CachedCookie]] = {}
    
    def get(self, provider_id: str, key: str) -> dict[str, str] | None:
        """
        获取缓存的 Cookie
        
        Args:
            provider_id: SSO 平台 ID
            key: 字段标识
            
        Returns:
            Cookie 字典，如果不存在则返回 None
        """
        provider_cache = self._cache.get(provider_id)
        if not provider_cache:
            return None
        
        cached = provider_cache.get(key)
        if not cached:
            return None
        
        return cached.cookies.copy()
    
    def get_cached_entry(self, provider_id: str, key: str) -> CachedCookie | None:
        """
        获取缓存条目（包含元数据）
        
        Args:
            provider_id: SSO 平台 ID
            key: 字段标识
            
        Returns:
            缓存条目，如果不存在则返回 None
        """
        provider_cache = self._cache.get(provider_id)
        if not provider_cache:
            return None
        
        return provider_cache.get(key)
    
    def set(self, provider_id: str, key: str, cookies: dict[str, str]) -> None:
        """
        设置 Cookie 缓存
        
        Args:
            provider_id: SSO 平台 ID
            key: 字段标识
            cookies: Cookie 字典
        """
        if provider_id not in self._cache:
            self._cache[provider_id] = {}
        
        self._cache[provider_id][key] = CachedCookie(cookies=cookies.copy())
    
    def mark_validated(self, provider_id: str, key: str) -> None:
        """
        标记 Cookie 为已验证
        
        Args:
            provider_id: SSO 平台 ID
            key: 字段标识
        """
        cached = self.get_cached_entry(provider_id, key)
        if cached:
            cached.mark_validated()
    
    def invalidate(self, provider_id: str, key: str) -> bool:
        """
        使缓存失效
        
        Args:
            provider_id: SSO 平台 ID
            key: 字段标识
            
        Returns:
            是否成功删除缓存
        """
        provider_cache = self._cache.get(provider_id)
        if not provider_cache:
            return False
        
        if key in provider_cache:
            del provider_cache[key]
            return True
        return False
    
    def invalidate_provider(self, provider_id: str) -> int:
        """
        使某个平台的所有缓存失效
        
        Args:
            provider_id: SSO 平台 ID
            
        Returns:
            删除的缓存数量
        """
        if provider_id in self._cache:
            count = len(self._cache[provider_id])
            del self._cache[provider_id]
            return count
        return 0
    
    def clear(self) -> int:
        """
        清空所有缓存
        
        Returns:
            删除的缓存数量
        """
        total = sum(len(v) for v in self._cache.values())
        self._cache.clear()
        return total
    
    def get_stats(self) -> dict:
        """
        获取缓存统计信息
        
        Returns:
            统计信息字典
        """
        total_entries = 0
        providers_stats = {}
        
        for provider_id, provider_cache in self._cache.items():
            entries = []
            for key, cached in provider_cache.items():
                entries.append({
                    "key": key,
                    "created_at": cached.created_at.isoformat(),
                    "last_validated_at": cached.last_validated_at.isoformat() if cached.last_validated_at else None,
                    "validation_count": cached.validation_count,
                })
            providers_stats[provider_id] = {
                "count": len(entries),
                "entries": entries,
            }
            total_entries += len(entries)
        
        return {
            "total_entries": total_entries,
            "providers": providers_stats,
        }


# 全局 Cookie 缓存实例
_cookie_cache: CookieCache | None = None


def get_cookie_cache() -> CookieCache:
    """获取全局 Cookie 缓存实例"""
    global _cookie_cache
    if _cookie_cache is None:
        _cookie_cache = CookieCache()
    return _cookie_cache


def init_cookie_cache() -> CookieCache:
    """
    初始化全局 Cookie 缓存
    
    Returns:
        Cookie 缓存实例
    """
    global _cookie_cache
    _cookie_cache = CookieCache()
    return _cookie_cache
