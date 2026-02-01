"""
认证中继服务 - FastAPI 入口
"""
import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.api.routes import router
from src.utils.config import init_config, get_config
from src.utils.crypto import init_crypto_manager
from src.storage.credential import init_credential_store
from src.storage.cookie_cache import init_cookie_cache
from src.auth.engine import close_auth_service


def setup_logging(config):
    """设置日志"""
    logging.basicConfig(
        level=getattr(logging, config.logging.level.upper()),
        format=config.logging.format,
    )


def init_services(config):
    """初始化所有服务"""
    # 初始化数据目录
    data_dir = Path(config.storage.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # 初始化加密管理器
    if config.encryption.key:
        init_crypto_manager(key=config.encryption.key)
    else:
        key_file = data_dir / "encryption.key"
        init_crypto_manager(key_file=key_file)
    
    # 初始化凭证存储
    init_credential_store(data_dir)
    
    # 初始化 Cookie 缓存
    init_cookie_cache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    logger = logging.getLogger(__name__)
    logger.info("认证中继服务启动中...")
    
    yield
    
    # 关闭时
    logger.info("认证中继服务关闭中...")
    await close_auth_service()


def create_app(config_path: str | Path | None = None) -> FastAPI:
    """创建 FastAPI 应用"""
    # 加载配置
    config = init_config(config_path)
    
    # 设置日志
    setup_logging(config)
    
    # 初始化服务
    init_services(config)
    
    # 创建应用
    app = FastAPI(
        title="认证中继服务",
        description="用于 Web 自动化脚本的 SSO 认证中继服务",
        version="1.0.0",
        lifespan=lifespan,
    )
    
    # CORS 配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 生产环境应该限制
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 注册 API 路由
    app.include_router(router, prefix="/api")
    
    # 挂载静态文件（React 前端）
    web_dir = project_root / "web" / "dist"
    if web_dir.exists():
        app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="static")
    
    return app


# 创建默认应用实例
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    config = get_config()
    uvicorn.run(
        "src.main:app",
        host=config.server.host,
        port=config.server.port,
        reload=config.server.debug,
    )
