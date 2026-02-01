"""
审计日志模块 - 记录所有系统操作
"""
import json
import logging
from datetime import datetime
from enum import Enum
from typing import Any

from src.storage.database import get_database

logger = logging.getLogger(__name__)


class AuditAction(str, Enum):
    """审计操作类型"""
    # Provider 操作
    PROVIDER_CREATE = "provider.create"
    PROVIDER_UPDATE = "provider.update"
    PROVIDER_DELETE = "provider.delete"
    PROVIDER_VIEW = "provider.view"
    PROVIDER_LIST = "provider.list"
    
    # Field 操作
    FIELD_CREATE = "field.create"
    FIELD_UPDATE = "field.update"
    FIELD_DELETE = "field.delete"
    FIELD_VIEW = "field.view"
    FIELD_LIST = "field.list"
    
    # 认证操作
    AUTH_REQUEST = "auth.request"
    AUTH_SUCCESS = "auth.success"
    AUTH_FAILURE = "auth.failure"
    AUTH_CACHE_HIT = "auth.cache_hit"
    AUTH_CACHE_MISS = "auth.cache_miss"
    
    # 缓存操作
    CACHE_CLEAR = "cache.clear"
    CACHE_CLEAR_PROVIDER = "cache.clear_provider"
    CACHE_CLEAR_FIELD = "cache.clear_field"
    CACHE_STATS = "cache.stats"
    
    # 系统操作
    LOGIN = "system.login"
    LOGOUT = "system.logout"


class ResourceType(str, Enum):
    """资源类型"""
    PROVIDER = "provider"
    FIELD = "field"
    AUTH = "auth"
    CACHE = "cache"
    SYSTEM = "system"


class AuditLogService:
    """审计日志服务"""
    
    async def log(
        self,
        action: str | AuditAction,
        resource_type: str | ResourceType,
        resource_id: str | None = None,
        user_role: str | None = None,
        ip_address: str | None = None,
        details: dict | None = None,
        success: bool = True,
    ) -> int:
        """
        记录审计日志
        
        Args:
            action: 操作类型
            resource_type: 资源类型
            resource_id: 资源标识
            user_role: 用户角色
            ip_address: 请求 IP
            details: 详情（JSON）
            success: 是否成功
            
        Returns:
            日志 ID
        """
        db = await get_database()
        
        # 转换枚举为字符串
        if isinstance(action, AuditAction):
            action = action.value
        if isinstance(resource_type, ResourceType):
            resource_type = resource_type.value
        
        # 序列化 details
        details_json = json.dumps(details, ensure_ascii=False) if details else None
        
        await db.execute(
            """
            INSERT INTO audit_logs (
                timestamp, action, resource_type, resource_id,
                user_role, ip_address, details, success
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                datetime.now(),
                action,
                resource_type,
                resource_id,
                user_role,
                ip_address,
                details_json,
                1 if success else 0,
            )
        )
        
        # 获取插入的 ID
        result = await db.fetch_one("SELECT LAST_INSERT_ID() as id")
        log_id = result["id"] if result else 0
        
        logger.debug(f"审计日志已记录: {action} - {resource_type}/{resource_id}")
        return log_id
    
    async def get_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        action: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        user_role: str | None = None,
        success: bool | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> dict:
        """
        查询审计日志
        
        Args:
            page: 页码（从 1 开始）
            page_size: 每页数量
            action: 按操作类型筛选
            resource_type: 按资源类型筛选
            resource_id: 按资源 ID 筛选
            user_role: 按用户角色筛选
            success: 按成功状态筛选
            start_time: 开始时间
            end_time: 结束时间
            
        Returns:
            包含 items, total, page, page_size 的字典
        """
        db = await get_database()
        
        # 构建查询条件
        conditions = []
        params = []
        
        if action:
            conditions.append("action = %s")
            params.append(action)
        
        if resource_type:
            conditions.append("resource_type = %s")
            params.append(resource_type)
        
        if resource_id:
            conditions.append("resource_id = %s")
            params.append(resource_id)
        
        if user_role:
            conditions.append("user_role = %s")
            params.append(user_role)
        
        if success is not None:
            conditions.append("success = %s")
            params.append(1 if success else 0)
        
        if start_time:
            conditions.append("timestamp >= %s")
            params.append(start_time)
        
        if end_time:
            conditions.append("timestamp <= %s")
            params.append(end_time)
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        # 查询总数
        count_result = await db.fetch_one(
            f"SELECT COUNT(*) as total FROM audit_logs WHERE {where_clause}",
            tuple(params)
        )
        total = count_result["total"] if count_result else 0
        
        # 查询数据
        offset = (page - 1) * page_size
        query_params = tuple(params) + (page_size, offset)
        
        rows = await db.fetch_all(
            f"""
            SELECT * FROM audit_logs 
            WHERE {where_clause}
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
            """,
            query_params
        )
        
        items = [self._row_to_dict(row) for row in rows]
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    
    async def get_stats(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> dict:
        """
        获取日志统计信息
        
        Args:
            start_time: 统计开始时间
            end_time: 统计结束时间
            
        Returns:
            统计信息字典
        """
        db = await get_database()
        
        # 构建时间条件
        time_conditions = []
        params = []
        
        if start_time:
            time_conditions.append("timestamp >= %s")
            params.append(start_time)
        
        if end_time:
            time_conditions.append("timestamp <= %s")
            params.append(end_time)
        
        where_clause = " AND ".join(time_conditions) if time_conditions else "1=1"
        
        # 总数统计
        total_result = await db.fetch_one(
            f"SELECT COUNT(*) as total FROM audit_logs WHERE {where_clause}",
            tuple(params)
        )
        total = total_result["total"] if total_result else 0
        
        # 成功/失败统计
        success_result = await db.fetch_one(
            f"SELECT COUNT(*) as count FROM audit_logs WHERE {where_clause} AND success = 1",
            tuple(params)
        )
        success_count = success_result["count"] if success_result else 0
        
        failure_result = await db.fetch_one(
            f"SELECT COUNT(*) as count FROM audit_logs WHERE {where_clause} AND success = 0",
            tuple(params)
        )
        failure_count = failure_result["count"] if failure_result else 0
        
        # 按操作类型统计
        action_stats = await db.fetch_all(
            f"""
            SELECT action, COUNT(*) as count 
            FROM audit_logs 
            WHERE {where_clause}
            GROUP BY action
            ORDER BY count DESC
            """,
            tuple(params)
        )
        
        # 按资源类型统计
        resource_stats = await db.fetch_all(
            f"""
            SELECT resource_type, COUNT(*) as count 
            FROM audit_logs 
            WHERE {where_clause}
            GROUP BY resource_type
            ORDER BY count DESC
            """,
            tuple(params)
        )
        
        # 按用户角色统计
        role_stats = await db.fetch_all(
            f"""
            SELECT user_role, COUNT(*) as count 
            FROM audit_logs 
            WHERE {where_clause} AND user_role IS NOT NULL
            GROUP BY user_role
            ORDER BY count DESC
            """,
            tuple(params)
        )
        
        return {
            "total": total,
            "success_count": success_count,
            "failure_count": failure_count,
            "by_action": {row["action"]: row["count"] for row in action_stats},
            "by_resource_type": {row["resource_type"]: row["count"] for row in resource_stats},
            "by_role": {row["user_role"]: row["count"] for row in role_stats if row["user_role"]},
        }
    
    def _row_to_dict(self, row: dict) -> dict:
        """将数据库行转换为字典"""
        details = row.get("details")
        if details and isinstance(details, str):
            try:
                details = json.loads(details)
            except json.JSONDecodeError:
                details = None
        
        return {
            "id": row["id"],
            "timestamp": row["timestamp"].isoformat() if row.get("timestamp") else None,
            "action": row["action"],
            "resource_type": row["resource_type"],
            "resource_id": row.get("resource_id"),
            "user_role": row.get("user_role"),
            "ip_address": row.get("ip_address"),
            "details": details,
            "success": bool(row.get("success", 1)),
        }


# 全局审计日志服务实例
_audit_log_service: AuditLogService | None = None


def get_audit_log_service() -> AuditLogService:
    """获取全局审计日志服务实例"""
    global _audit_log_service
    if _audit_log_service is None:
        _audit_log_service = AuditLogService()
    return _audit_log_service
