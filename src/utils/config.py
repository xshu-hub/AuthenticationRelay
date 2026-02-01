"""
配置加载模块
"""
import os
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class ServerConfig(BaseModel):
    """服务器配置"""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False


class EncryptionConfig(BaseModel):
    """加密配置"""
    key: str | None = None


class StorageConfig(BaseModel):
    """存储配置"""
    data_dir: str = "./data"
    providers_file: str = "providers.json"


class DatabaseConfig(BaseModel):
    """MySQL 数据库配置"""
    host: str = "localhost"
    port: int = 3306
    user: str = "root"
    password: str = ""
    database: str = "auth_relay"
    pool_size: int = 5


class LoggingConfig(BaseModel):
    """日志配置"""
    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


class PlaywrightConfig(BaseModel):
    """Playwright 配置"""
    headless: bool = True
    timeout: int = 30000


class ApiKeysConfig(BaseModel):
    """API 密钥配置"""
    admin: str = "your-admin-api-key-here"
    user: str = "your-user-api-key-here"


class AppConfig(BaseModel):
    """应用配置"""
    server: ServerConfig = ServerConfig()
    # 新的双 Key 配置
    api_keys: ApiKeysConfig = ApiKeysConfig()
    # 兼容旧的单 Key 配置（已废弃，但保留向后兼容）
    api_key: str | None = None
    encryption: EncryptionConfig = EncryptionConfig()
    storage: StorageConfig = StorageConfig()
    database: DatabaseConfig = DatabaseConfig()
    logging: LoggingConfig = LoggingConfig()
    playwright: PlaywrightConfig = PlaywrightConfig()


def load_config(config_path: str | Path | None = None) -> AppConfig:
    """
    加载配置文件
    
    Args:
        config_path: 配置文件路径，默认为项目根目录的 config.yaml
        
    Returns:
        应用配置对象
    """
    if config_path is None:
        # 默认配置文件路径
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
    
    config_path = Path(config_path)
    
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            config_data = yaml.safe_load(f) or {}
    else:
        config_data = {}
    
    # 环境变量覆盖
    # 支持新的双 Key 配置
    if os.environ.get("ADMIN_API_KEY"):
        if "api_keys" not in config_data:
            config_data["api_keys"] = {}
        config_data["api_keys"]["admin"] = os.environ["ADMIN_API_KEY"]
    
    if os.environ.get("USER_API_KEY"):
        if "api_keys" not in config_data:
            config_data["api_keys"] = {}
        config_data["api_keys"]["user"] = os.environ["USER_API_KEY"]
    
    # 兼容旧的单 Key 配置（已废弃）
    if os.environ.get("API_KEY"):
        config_data["api_key"] = os.environ["API_KEY"]
    
    if os.environ.get("ENCRYPTION_KEY"):
        if "encryption" not in config_data:
            config_data["encryption"] = {}
        config_data["encryption"]["key"] = os.environ["ENCRYPTION_KEY"]
    
    if os.environ.get("SERVER_HOST"):
        if "server" not in config_data:
            config_data["server"] = {}
        config_data["server"]["host"] = os.environ["SERVER_HOST"]
    
    if os.environ.get("SERVER_PORT"):
        if "server" not in config_data:
            config_data["server"] = {}
        config_data["server"]["port"] = int(os.environ["SERVER_PORT"])
    
    # 数据库配置环境变量
    if os.environ.get("DB_HOST"):
        if "database" not in config_data:
            config_data["database"] = {}
        config_data["database"]["host"] = os.environ["DB_HOST"]
    
    if os.environ.get("DB_PORT"):
        if "database" not in config_data:
            config_data["database"] = {}
        config_data["database"]["port"] = int(os.environ["DB_PORT"])
    
    if os.environ.get("DB_USER"):
        if "database" not in config_data:
            config_data["database"] = {}
        config_data["database"]["user"] = os.environ["DB_USER"]
    
    if os.environ.get("DB_PASSWORD"):
        if "database" not in config_data:
            config_data["database"] = {}
        config_data["database"]["password"] = os.environ["DB_PASSWORD"]
    
    if os.environ.get("DB_NAME"):
        if "database" not in config_data:
            config_data["database"] = {}
        config_data["database"]["database"] = os.environ["DB_NAME"]
    
    return AppConfig(**config_data)


# 全局配置实例
_config: AppConfig | None = None


def get_config() -> AppConfig:
    """获取全局配置实例"""
    global _config
    if _config is None:
        _config = load_config()
    return _config


def init_config(config_path: str | Path | None = None) -> AppConfig:
    """
    初始化全局配置
    
    Args:
        config_path: 配置文件路径
        
    Returns:
        应用配置对象
    """
    global _config
    _config = load_config(config_path)
    return _config
