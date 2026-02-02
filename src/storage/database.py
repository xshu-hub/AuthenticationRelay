"""
MySQL 数据库模块 - 管理数据库连接池和表结构
"""
import logging

import aiomysql

from src.utils.config import get_config

logger = logging.getLogger(__name__)


class Database:
    """MySQL 数据库管理器"""
    
    _instance: "Database | None" = None
    _pool: aiomysql.Pool | None = None
    
    # 表结构定义
    TABLES = {
        "providers": """
            CREATE TABLE IF NOT EXISTS providers (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                login_url VARCHAR(512) NOT NULL,
                username_selector VARCHAR(255) NOT NULL,
                password_selector VARCHAR(255) NOT NULL,
                submit_selector VARCHAR(255) NOT NULL,
                success_indicator VARCHAR(512),
                success_indicator_type VARCHAR(32) DEFAULT 'url_contains',
                validate_url VARCHAR(512),
                invalid_indicator VARCHAR(512),
                invalid_indicator_type VARCHAR(32) DEFAULT 'url_contains',
                wait_after_login INT DEFAULT 2000,
                created_at DATETIME,
                updated_at DATETIME
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        "fields": """
            CREATE TABLE IF NOT EXISTS fields (
                id INT AUTO_INCREMENT PRIMARY KEY,
                provider_id VARCHAR(64) NOT NULL,
                `key` VARCHAR(64) NOT NULL,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(512) NOT NULL,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
                UNIQUE KEY uk_provider_key (provider_id, `key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
        "audit_logs": """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME NOT NULL,
                action VARCHAR(64) NOT NULL,
                resource_type VARCHAR(32) NOT NULL,
                resource_id VARCHAR(128),
                user_role VARCHAR(16),
                ip_address VARCHAR(45),
                details JSON,
                success TINYINT(1) DEFAULT 1,
                INDEX idx_timestamp (timestamp),
                INDEX idx_action (action),
                INDEX idx_resource_type (resource_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """,
    }
    
    def __init__(self):
        """初始化数据库管理器"""
        self._pool = None
    
    @classmethod
    async def get_instance(cls) -> "Database":
        """获取数据库单例实例"""
        if cls._instance is None:
            cls._instance = Database()
            await cls._instance._init_pool()
        return cls._instance
    
    async def _init_pool(self) -> None:
        """初始化连接池"""
        config = get_config()
        db_config = config.database
        
        # 先连接到 MySQL 服务器（不指定数据库），创建数据库
        await self._ensure_database_exists(db_config)
        
        # 然后创建连接池
        self._pool = await aiomysql.create_pool(
            host=db_config.host,
            port=db_config.port,
            user=db_config.user,
            password=db_config.password,
            db=db_config.database,
            charset="utf8mb4",
            autocommit=True,
            minsize=1,
            maxsize=db_config.pool_size,
        )
        logger.info(f"MySQL 连接池已创建: {db_config.host}:{db_config.port}/{db_config.database}")
    
    async def _ensure_database_exists(self, db_config) -> None:
        """确保数据库存在，如果不存在则创建"""
        conn = await aiomysql.connect(
            host=db_config.host,
            port=db_config.port,
            user=db_config.user,
            password=db_config.password,
            charset="utf8mb4",
        )
        try:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{db_config.database}` "
                    f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            await conn.commit()
            logger.info(f"数据库 '{db_config.database}' 已就绪")
        finally:
            conn.close()
    
    async def init_tables(self) -> None:
        """初始化数据库表结构"""
        async with self._pool.acquire() as conn:
            async with conn.cursor() as cursor:
                for table_name, create_sql in self.TABLES.items():
                    await cursor.execute(create_sql)
                    logger.info(f"表 {table_name} 已就绪")
    
    async def execute(
        self,
        query: str,
        args: tuple | None = None,
    ) -> int:
        """
        执行写操作（INSERT/UPDATE/DELETE）
        
        Returns:
            受影响的行数
        """
        async with self._pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(query, args)
                return cursor.rowcount
    
    async def fetch_one(
        self,
        query: str,
        args: tuple | None = None,
    ) -> dict | None:
        """
        查询单条记录
        
        Returns:
            记录字典或 None
        """
        async with self._pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, args)
                return await cursor.fetchone()
    
    async def fetch_all(
        self,
        query: str,
        args: tuple | None = None,
    ) -> list[dict]:
        """
        查询多条记录
        
        Returns:
            记录列表
        """
        async with self._pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(query, args)
                return await cursor.fetchall()
    
    async def close(self) -> None:
        """关闭连接池"""
        if self._pool:
            self._pool.close()
            await self._pool.wait_closed()
            logger.info("MySQL 连接池已关闭")
    
    @classmethod
    async def close_instance(cls) -> None:
        """关闭单例实例"""
        if cls._instance:
            await cls._instance.close()
            cls._instance = None


# 便捷函数
async def get_database() -> Database:
    """获取数据库实例"""
    return await Database.get_instance()


async def init_database() -> Database:
    """
    初始化数据库（创建表结构）
    
    Returns:
        数据库实例
    """
    db = await Database.get_instance()
    await db.init_tables()
    return db


async def close_database() -> None:
    """关闭数据库连接"""
    await Database.close_instance()
