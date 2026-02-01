"""
凭证存储模块 - 管理 SSO 平台配置和字段账号
"""
import json
from pathlib import Path
from typing import Any
from datetime import datetime

from src.utils.crypto import get_crypto_manager


class CredentialStore:
    """凭证存储管理器"""
    
    def __init__(self, data_dir: Path):
        """
        初始化凭证存储
        
        Args:
            data_dir: 数据存储目录
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.providers_file = self.data_dir / "providers.json"
        self._providers: dict[str, dict] = {}
        self._load()
    
    def _load(self) -> None:
        """从文件加载数据"""
        if self.providers_file.exists():
            try:
                with open(self.providers_file, "r", encoding="utf-8") as f:
                    self._providers = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._providers = {}
        else:
            self._providers = {}
    
    def _save(self) -> None:
        """保存数据到文件"""
        with open(self.providers_file, "w", encoding="utf-8") as f:
            json.dump(self._providers, f, ensure_ascii=False, indent=2)
    
    # ==================== SSO Provider 操作 ====================
    
    def get_all_providers(self) -> list[dict]:
        """获取所有 SSO 平台（不含密码明文）"""
        result = []
        for provider_id, provider in self._providers.items():
            provider_copy = provider.copy()
            # 移除字段中的密码
            if "fields" in provider_copy:
                provider_copy["fields"] = [
                    {k: v for k, v in field.items() if k != "password"}
                    for field in provider_copy["fields"]
                ]
            result.append(provider_copy)
        return result
    
    def get_provider(self, provider_id: str) -> dict | None:
        """获取单个 SSO 平台配置（不含密码明文）"""
        provider = self._providers.get(provider_id)
        if provider:
            provider_copy = provider.copy()
            if "fields" in provider_copy:
                provider_copy["fields"] = [
                    {k: v for k, v in field.items() if k != "password"}
                    for field in provider_copy["fields"]
                ]
            return provider_copy
        return None
    
    def get_provider_with_credentials(self, provider_id: str) -> dict | None:
        """获取 SSO 平台配置（含解密后的密码）"""
        provider = self._providers.get(provider_id)
        if not provider:
            return None
        
        crypto = get_crypto_manager()
        provider_copy = provider.copy()
        
        if "fields" in provider_copy:
            decrypted_fields = []
            for field in provider_copy["fields"]:
                field_copy = field.copy()
                if "password" in field_copy and field_copy["password"]:
                    try:
                        field_copy["password"] = crypto.decrypt(field_copy["password"])
                    except Exception:
                        pass  # 解密失败保持原样
                decrypted_fields.append(field_copy)
            provider_copy["fields"] = decrypted_fields
        
        return provider_copy
    
    def create_provider(self, provider_data: dict) -> dict:
        """创建 SSO 平台"""
        provider_id = provider_data.get("id")
        if not provider_id:
            raise ValueError("Provider ID 不能为空")
        
        if provider_id in self._providers:
            raise ValueError(f"Provider '{provider_id}' 已存在")
        
        # 确保 fields 字段存在
        if "fields" not in provider_data:
            provider_data["fields"] = []
        
        # 加密字段中的密码
        crypto = get_crypto_manager()
        encrypted_fields = []
        for field in provider_data.get("fields", []):
            field_copy = field.copy()
            if "password" in field_copy and field_copy["password"]:
                field_copy["password"] = crypto.encrypt(field_copy["password"])
            encrypted_fields.append(field_copy)
        
        provider_data["fields"] = encrypted_fields
        provider_data["created_at"] = datetime.now().isoformat()
        provider_data["updated_at"] = datetime.now().isoformat()
        
        self._providers[provider_id] = provider_data
        self._save()
        
        return self.get_provider(provider_id)
    
    def update_provider(self, provider_id: str, provider_data: dict) -> dict | None:
        """更新 SSO 平台（不更新 fields）"""
        if provider_id not in self._providers:
            return None
        
        existing = self._providers[provider_id]
        
        # 保留原有的 fields 和 created_at
        fields = existing.get("fields", [])
        created_at = existing.get("created_at")
        
        # 更新其他字段
        for key, value in provider_data.items():
            if key not in ("id", "fields", "created_at"):
                existing[key] = value
        
        existing["fields"] = fields
        existing["created_at"] = created_at
        existing["updated_at"] = datetime.now().isoformat()
        
        self._save()
        return self.get_provider(provider_id)
    
    def delete_provider(self, provider_id: str) -> bool:
        """删除 SSO 平台"""
        if provider_id in self._providers:
            del self._providers[provider_id]
            self._save()
            return True
        return False
    
    # ==================== Field 操作 ====================
    
    def get_fields(self, provider_id: str) -> list[dict] | None:
        """获取平台下所有字段（不含密码）"""
        provider = self._providers.get(provider_id)
        if not provider:
            return None
        
        return [
            {k: v for k, v in field.items() if k != "password"}
            for field in provider.get("fields", [])
        ]
    
    def get_field(self, provider_id: str, key: str) -> dict | None:
        """获取单个字段（不含密码）"""
        provider = self._providers.get(provider_id)
        if not provider:
            return None
        
        for field in provider.get("fields", []):
            if field.get("key") == key:
                return {k: v for k, v in field.items() if k != "password"}
        return None
    
    def get_field_with_credentials(self, provider_id: str, key: str) -> dict | None:
        """获取字段（含解密后的密码）"""
        provider = self._providers.get(provider_id)
        if not provider:
            return None
        
        crypto = get_crypto_manager()
        
        for field in provider.get("fields", []):
            if field.get("key") == key:
                field_copy = field.copy()
                if "password" in field_copy and field_copy["password"]:
                    try:
                        field_copy["password"] = crypto.decrypt(field_copy["password"])
                    except Exception:
                        pass
                return field_copy
        return None
    
    def create_field(self, provider_id: str, field_data: dict) -> dict | None:
        """创建字段账号"""
        provider = self._providers.get(provider_id)
        if not provider:
            return None
        
        key = field_data.get("key")
        if not key:
            raise ValueError("Field key 不能为空")
        
        # 检查是否已存在
        for field in provider.get("fields", []):
            if field.get("key") == key:
                raise ValueError(f"Field '{key}' 已存在")
        
        # 加密密码
        crypto = get_crypto_manager()
        field_copy = field_data.copy()
        if "password" in field_copy and field_copy["password"]:
            field_copy["password"] = crypto.encrypt(field_copy["password"])
        
        field_copy["created_at"] = datetime.now().isoformat()
        field_copy["updated_at"] = datetime.now().isoformat()
        
        if "fields" not in provider:
            provider["fields"] = []
        provider["fields"].append(field_copy)
        provider["updated_at"] = datetime.now().isoformat()
        
        self._save()
        return self.get_field(provider_id, key)
    
    def update_field(self, provider_id: str, key: str, field_data: dict) -> dict | None:
        """更新字段账号"""
        provider = self._providers.get(provider_id)
        if not provider:
            return None
        
        crypto = get_crypto_manager()
        
        for i, field in enumerate(provider.get("fields", [])):
            if field.get("key") == key:
                # 更新字段
                for k, v in field_data.items():
                    if k == "key":
                        continue  # 不允许修改 key
                    if k == "password" and v:
                        field[k] = crypto.encrypt(v)
                    else:
                        field[k] = v
                
                field["updated_at"] = datetime.now().isoformat()
                provider["updated_at"] = datetime.now().isoformat()
                
                self._save()
                return self.get_field(provider_id, key)
        
        return None
    
    def delete_field(self, provider_id: str, key: str) -> bool:
        """删除字段账号"""
        provider = self._providers.get(provider_id)
        if not provider:
            return False
        
        fields = provider.get("fields", [])
        for i, field in enumerate(fields):
            if field.get("key") == key:
                fields.pop(i)
                provider["updated_at"] = datetime.now().isoformat()
                self._save()
                return True
        
        return False


# 全局凭证存储实例
_credential_store: CredentialStore | None = None


def get_credential_store() -> CredentialStore:
    """获取全局凭证存储实例"""
    global _credential_store
    if _credential_store is None:
        raise RuntimeError("凭证存储未初始化，请先调用 init_credential_store()")
    return _credential_store


def init_credential_store(data_dir: Path) -> CredentialStore:
    """
    初始化全局凭证存储
    
    Args:
        data_dir: 数据存储目录
        
    Returns:
        凭证存储实例
    """
    global _credential_store
    _credential_store = CredentialStore(data_dir)
    return _credential_store
