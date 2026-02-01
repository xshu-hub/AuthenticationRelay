"""
凭证存储模块 - 管理 SSO 平台配置和字段账号（MySQL 版本）
"""
from datetime import datetime
from typing import Any

from src.storage.database import get_database
from src.utils.crypto import get_crypto_manager


class CredentialStore:
    """凭证存储管理器（使用 MySQL 数据库）"""
    
    def __init__(self):
        """初始化凭证存储"""
        pass
    
    # ==================== SSO Provider 操作 ====================
    
    async def get_all_providers(self) -> list[dict]:
        """获取所有 SSO 平台（不含密码明文）"""
        db = await get_database()
        
        # 获取所有 Provider
        providers = await db.fetch_all(
            "SELECT * FROM providers ORDER BY created_at DESC"
        )
        
        result = []
        for provider in providers:
            provider_dict = self._row_to_provider_dict(provider)
            # 获取该 Provider 的 Fields（不含密码）
            fields = await db.fetch_all(
                "SELECT id, provider_id, `key`, username, created_at, updated_at FROM fields WHERE provider_id = %s",
                (provider["id"],)
            )
            provider_dict["fields"] = [self._row_to_field_dict(f) for f in fields]
            result.append(provider_dict)
        
        return result
    
    async def get_provider(self, provider_id: str) -> dict | None:
        """获取单个 SSO 平台配置（不含密码明文）"""
        db = await get_database()
        
        provider = await db.fetch_one(
            "SELECT * FROM providers WHERE id = %s",
            (provider_id,)
        )
        
        if not provider:
            return None
        
        provider_dict = self._row_to_provider_dict(provider)
        
        # 获取 Fields（不含密码）
        fields = await db.fetch_all(
            "SELECT id, provider_id, `key`, username, created_at, updated_at FROM fields WHERE provider_id = %s",
            (provider_id,)
        )
        provider_dict["fields"] = [self._row_to_field_dict(f) for f in fields]
        
        return provider_dict
    
    async def get_provider_with_credentials(self, provider_id: str) -> dict | None:
        """获取 SSO 平台配置（含解密后的密码）"""
        db = await get_database()
        crypto = get_crypto_manager()
        
        provider = await db.fetch_one(
            "SELECT * FROM providers WHERE id = %s",
            (provider_id,)
        )
        
        if not provider:
            return None
        
        provider_dict = self._row_to_provider_dict(provider)
        
        # 获取 Fields（含密码并解密）
        fields = await db.fetch_all(
            "SELECT * FROM fields WHERE provider_id = %s",
            (provider_id,)
        )
        
        decrypted_fields = []
        for field in fields:
            field_dict = self._row_to_field_dict(field)
            if field.get("password"):
                try:
                    field_dict["password"] = crypto.decrypt(field["password"])
                except Exception:
                    field_dict["password"] = field["password"]
            decrypted_fields.append(field_dict)
        
        provider_dict["fields"] = decrypted_fields
        return provider_dict
    
    async def create_provider(self, provider_data: dict) -> dict:
        """创建 SSO 平台"""
        db = await get_database()
        
        provider_id = provider_data.get("id")
        if not provider_id:
            raise ValueError("Provider ID 不能为空")
        
        # 检查是否已存在
        existing = await db.fetch_one(
            "SELECT id FROM providers WHERE id = %s",
            (provider_id,)
        )
        if existing:
            raise ValueError(f"Provider '{provider_id}' 已存在")
        
        now = datetime.now()
        
        # 插入 Provider
        await db.execute(
            """
            INSERT INTO providers (
                id, name, login_url, username_selector, password_selector,
                submit_selector, success_indicator, success_indicator_type,
                validate_url, invalid_indicator, invalid_indicator_type,
                wait_after_login, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                provider_id,
                provider_data.get("name", ""),
                provider_data.get("login_url", ""),
                provider_data.get("username_selector", ""),
                provider_data.get("password_selector", ""),
                provider_data.get("submit_selector", ""),
                provider_data.get("success_indicator"),
                provider_data.get("success_indicator_type", "url_contains"),
                provider_data.get("validate_url"),
                provider_data.get("invalid_indicator"),
                provider_data.get("invalid_indicator_type", "url_contains"),
                provider_data.get("wait_after_login", 2000),
                now,
                now,
            )
        )
        
        # 处理 Fields（如果有）
        crypto = get_crypto_manager()
        for field in provider_data.get("fields", []):
            password = field.get("password", "")
            if password:
                password = crypto.encrypt(password)
            
            await db.execute(
                """
                INSERT INTO fields (provider_id, `key`, username, password, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (provider_id, field.get("key", ""), field.get("username", ""), password, now, now)
            )
        
        return await self.get_provider(provider_id)
    
    async def update_provider(self, provider_id: str, provider_data: dict) -> dict | None:
        """更新 SSO 平台（不更新 fields）"""
        db = await get_database()
        
        # 检查是否存在
        existing = await db.fetch_one(
            "SELECT id FROM providers WHERE id = %s",
            (provider_id,)
        )
        if not existing:
            return None
        
        # 构建更新语句
        update_fields = []
        update_values = []
        
        field_mapping = {
            "name": "name",
            "login_url": "login_url",
            "username_selector": "username_selector",
            "password_selector": "password_selector",
            "submit_selector": "submit_selector",
            "success_indicator": "success_indicator",
            "success_indicator_type": "success_indicator_type",
            "validate_url": "validate_url",
            "invalid_indicator": "invalid_indicator",
            "invalid_indicator_type": "invalid_indicator_type",
            "wait_after_login": "wait_after_login",
        }
        
        for key, column in field_mapping.items():
            if key in provider_data:
                update_fields.append(f"{column} = %s")
                update_values.append(provider_data[key])
        
        if update_fields:
            update_fields.append("updated_at = %s")
            update_values.append(datetime.now())
            update_values.append(provider_id)
            
            await db.execute(
                f"UPDATE providers SET {', '.join(update_fields)} WHERE id = %s",
                tuple(update_values)
            )
        
        return await self.get_provider(provider_id)
    
    async def delete_provider(self, provider_id: str) -> bool:
        """删除 SSO 平台"""
        db = await get_database()
        
        # 由于有外键约束，删除 Provider 时会自动删除关联的 Fields
        rowcount = await db.execute(
            "DELETE FROM providers WHERE id = %s",
            (provider_id,)
        )
        
        return rowcount > 0
    
    # ==================== Field 操作 ====================
    
    async def get_fields(self, provider_id: str) -> list[dict] | None:
        """获取平台下所有字段（不含密码）"""
        db = await get_database()
        
        # 先检查 Provider 是否存在
        provider = await db.fetch_one(
            "SELECT id FROM providers WHERE id = %s",
            (provider_id,)
        )
        if not provider:
            return None
        
        fields = await db.fetch_all(
            "SELECT id, provider_id, `key`, username, created_at, updated_at FROM fields WHERE provider_id = %s",
            (provider_id,)
        )
        
        return [self._row_to_field_dict(f) for f in fields]
    
    async def get_field(self, provider_id: str, key: str) -> dict | None:
        """获取单个字段（不含密码）"""
        db = await get_database()
        
        field = await db.fetch_one(
            "SELECT id, provider_id, `key`, username, created_at, updated_at FROM fields WHERE provider_id = %s AND `key` = %s",
            (provider_id, key)
        )
        
        if not field:
            return None
        
        return self._row_to_field_dict(field)
    
    async def get_field_with_credentials(self, provider_id: str, key: str) -> dict | None:
        """获取字段（含解密后的密码）"""
        db = await get_database()
        crypto = get_crypto_manager()
        
        field = await db.fetch_one(
            "SELECT * FROM fields WHERE provider_id = %s AND `key` = %s",
            (provider_id, key)
        )
        
        if not field:
            return None
        
        field_dict = self._row_to_field_dict(field)
        if field.get("password"):
            try:
                field_dict["password"] = crypto.decrypt(field["password"])
            except Exception:
                field_dict["password"] = field["password"]
        
        return field_dict
    
    async def create_field(self, provider_id: str, field_data: dict) -> dict | None:
        """创建字段账号"""
        db = await get_database()
        
        # 检查 Provider 是否存在
        provider = await db.fetch_one(
            "SELECT id FROM providers WHERE id = %s",
            (provider_id,)
        )
        if not provider:
            return None
        
        key = field_data.get("key")
        if not key:
            raise ValueError("Field key 不能为空")
        
        # 检查是否已存在
        existing = await db.fetch_one(
            "SELECT id FROM fields WHERE provider_id = %s AND `key` = %s",
            (provider_id, key)
        )
        if existing:
            raise ValueError(f"Field '{key}' 已存在")
        
        # 加密密码
        crypto = get_crypto_manager()
        password = field_data.get("password", "")
        if password:
            password = crypto.encrypt(password)
        
        now = datetime.now()
        
        await db.execute(
            """
            INSERT INTO fields (provider_id, `key`, username, password, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (provider_id, key, field_data.get("username", ""), password, now, now)
        )
        
        # 更新 Provider 的 updated_at
        await db.execute(
            "UPDATE providers SET updated_at = %s WHERE id = %s",
            (now, provider_id)
        )
        
        return await self.get_field(provider_id, key)
    
    async def update_field(self, provider_id: str, key: str, field_data: dict) -> dict | None:
        """更新字段账号"""
        db = await get_database()
        crypto = get_crypto_manager()
        
        # 检查是否存在
        existing = await db.fetch_one(
            "SELECT id FROM fields WHERE provider_id = %s AND `key` = %s",
            (provider_id, key)
        )
        if not existing:
            return None
        
        # 构建更新语句
        update_fields = []
        update_values = []
        
        if "username" in field_data:
            update_fields.append("username = %s")
            update_values.append(field_data["username"])
        
        if "password" in field_data and field_data["password"]:
            update_fields.append("password = %s")
            update_values.append(crypto.encrypt(field_data["password"]))
        
        if update_fields:
            now = datetime.now()
            update_fields.append("updated_at = %s")
            update_values.append(now)
            update_values.extend([provider_id, key])
            
            await db.execute(
                f"UPDATE fields SET {', '.join(update_fields)} WHERE provider_id = %s AND `key` = %s",
                tuple(update_values)
            )
            
            # 更新 Provider 的 updated_at
            await db.execute(
                "UPDATE providers SET updated_at = %s WHERE id = %s",
                (now, provider_id)
            )
        
        return await self.get_field(provider_id, key)
    
    async def delete_field(self, provider_id: str, key: str) -> bool:
        """删除字段账号"""
        db = await get_database()
        
        rowcount = await db.execute(
            "DELETE FROM fields WHERE provider_id = %s AND `key` = %s",
            (provider_id, key)
        )
        
        if rowcount > 0:
            # 更新 Provider 的 updated_at
            await db.execute(
                "UPDATE providers SET updated_at = %s WHERE id = %s",
                (datetime.now(), provider_id)
            )
            return True
        
        return False
    
    # ==================== 辅助方法 ====================
    
    def _row_to_provider_dict(self, row: dict) -> dict:
        """将数据库行转换为 Provider 字典"""
        return {
            "id": row["id"],
            "name": row["name"],
            "login_url": row["login_url"],
            "username_selector": row["username_selector"],
            "password_selector": row["password_selector"],
            "submit_selector": row["submit_selector"],
            "success_indicator": row.get("success_indicator"),
            "success_indicator_type": row.get("success_indicator_type", "url_contains"),
            "validate_url": row.get("validate_url"),
            "invalid_indicator": row.get("invalid_indicator"),
            "invalid_indicator_type": row.get("invalid_indicator_type", "url_contains"),
            "wait_after_login": row.get("wait_after_login", 2000),
            "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
            "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None,
            "fields": [],
        }
    
    def _row_to_field_dict(self, row: dict) -> dict:
        """将数据库行转换为 Field 字典"""
        result = {
            "key": row["key"],
            "username": row["username"],
            "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
            "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None,
        }
        # 如果有密码字段，添加它
        if "password" in row:
            result["password"] = row["password"]
        return result


# 全局凭证存储实例
_credential_store: CredentialStore | None = None


def get_credential_store() -> CredentialStore:
    """获取全局凭证存储实例"""
    global _credential_store
    if _credential_store is None:
        raise RuntimeError("凭证存储未初始化，请先调用 init_credential_store()")
    return _credential_store


def init_credential_store(data_dir=None) -> CredentialStore:
    """
    初始化全局凭证存储
    
    Args:
        data_dir: 数据存储目录（保留参数以兼容旧接口，但不再使用）
        
    Returns:
        凭证存储实例
    """
    global _credential_store
    _credential_store = CredentialStore()
    return _credential_store
