"""
认证引擎 - 使用 Playwright 执行动态登录和 Cookie 验证
"""
import asyncio
import logging
from typing import Any

from playwright.async_api import async_playwright, Browser, BrowserContext, Page

from src.storage.credential import get_credential_store
from src.storage.cookie_cache import get_cookie_cache
from src.utils.config import get_config

logger = logging.getLogger(__name__)


class AuthenticationError(Exception):
    """认证错误"""
    pass


class ValidationError(Exception):
    """验证错误"""
    pass


class AuthEngine:
    """认证引擎"""
    
    def __init__(self):
        """初始化认证引擎"""
        self._browser: Browser | None = None
        self._playwright = None
    
    async def _ensure_browser(self) -> Browser:
        """确保浏览器已启动"""
        if self._browser is None or not self._browser.is_connected():
            config = get_config()
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=config.playwright.headless
            )
        return self._browser
    
    async def close(self) -> None:
        """关闭浏览器"""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
    
    async def login(self, provider_config: dict, username: str, password: str) -> dict[str, str]:
        """
        执行登录并获取 Cookie
        
        Args:
            provider_config: SSO 平台配置
            username: 用户名
            password: 密码
            
        Returns:
            登录后的 Cookie 字典
        """
        config = get_config()
        browser = await self._ensure_browser()
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # 设置超时
            page.set_default_timeout(config.playwright.timeout)
            
            # 1. 打开登录页面
            login_url = provider_config.get("login_url")
            if not login_url:
                raise AuthenticationError("登录 URL 未配置")
            
            logger.info(f"正在打开登录页面: {login_url}")
            await page.goto(login_url)
            
            # 2. 等待页面加载
            await page.wait_for_load_state("networkidle")
            
            # 3. 填写用户名
            username_selector = provider_config.get("username_selector")
            if username_selector:
                logger.debug(f"填写用户名: {username_selector}")
                await page.fill(username_selector, username)
            
            # 4. 填写密码
            password_selector = provider_config.get("password_selector")
            if password_selector:
                logger.debug(f"填写密码: {password_selector}")
                await page.fill(password_selector, password)
            
            # 5. 点击登录按钮
            submit_selector = provider_config.get("submit_selector")
            if submit_selector:
                logger.debug(f"点击登录按钮: {submit_selector}")
                await page.click(submit_selector)
            
            # 6. 等待登录成功
            success_indicator = provider_config.get("success_indicator")
            success_indicator_type = provider_config.get("success_indicator_type", "url_contains")
            
            if success_indicator:
                await self._wait_for_success(page, success_indicator, success_indicator_type)
            else:
                # 默认等待页面加载完成
                await page.wait_for_load_state("networkidle")
            
            # 7. 额外等待时间
            wait_after_login = provider_config.get("wait_after_login", 2000)
            if wait_after_login > 0:
                await asyncio.sleep(wait_after_login / 1000)
            
            # 8. 提取 Cookie
            cookies = await context.cookies()
            cookie_dict = {cookie["name"]: cookie["value"] for cookie in cookies}
            
            logger.info(f"登录成功，获取到 {len(cookie_dict)} 个 Cookie")
            return cookie_dict
            
        except Exception as e:
            logger.error(f"登录失败: {e}")
            raise AuthenticationError(f"登录失败: {e}")
        finally:
            await context.close()
    
    async def _wait_for_success(self, page: Page, indicator: str, indicator_type: str) -> None:
        """等待登录成功标识"""
        config = get_config()
        timeout = config.playwright.timeout
        
        if indicator_type == "url_contains":
            await page.wait_for_url(f"**/*{indicator}*", timeout=timeout)
        elif indicator_type == "url_equals":
            await page.wait_for_url(indicator, timeout=timeout)
        elif indicator_type == "element_exists":
            await page.wait_for_selector(indicator, timeout=timeout)
        else:
            # 默认等待网络空闲
            await page.wait_for_load_state("networkidle")
    
    async def validate_cookies(self, provider_config: dict, cookies: dict[str, str]) -> bool:
        """
        验证 Cookie 是否有效
        
        Args:
            provider_config: SSO 平台配置
            cookies: 要验证的 Cookie
            
        Returns:
            Cookie 是否有效
        """
        validate_url = provider_config.get("validate_url")
        if not validate_url:
            # 如果没有配置验证 URL，默认认为有效
            logger.warning("未配置验证 URL，跳过验证")
            return True
        
        config = get_config()
        browser = await self._ensure_browser()
        context = await browser.new_context()
        
        try:
            # 设置 Cookie
            cookie_list = [
                {
                    "name": name,
                    "value": value,
                    "domain": self._extract_domain(validate_url),
                    "path": "/",
                }
                for name, value in cookies.items()
            ]
            await context.add_cookies(cookie_list)
            
            page = await context.new_page()
            page.set_default_timeout(config.playwright.timeout)
            
            # 访问验证 URL
            logger.info(f"正在验证 Cookie: {validate_url}")
            response = await page.goto(validate_url)
            
            # 检查失效标识
            invalid_indicator = provider_config.get("invalid_indicator")
            invalid_indicator_type = provider_config.get("invalid_indicator_type", "url_contains")
            
            if invalid_indicator:
                is_invalid = await self._check_invalid_indicator(
                    page, response, invalid_indicator, invalid_indicator_type
                )
                if is_invalid:
                    logger.info("Cookie 已失效")
                    return False
            
            logger.info("Cookie 有效")
            return True
            
        except Exception as e:
            logger.error(f"验证失败: {e}")
            return False
        finally:
            await context.close()
    
    async def _check_invalid_indicator(
        self, 
        page: Page, 
        response: Any, 
        indicator: str, 
        indicator_type: str
    ) -> bool:
        """检查是否存在失效标识"""
        if indicator_type == "status_code":
            # 检查响应状态码
            return str(response.status) == indicator
        elif indicator_type == "url_contains":
            # 检查 URL 是否包含特定字符串
            return indicator in page.url
        elif indicator_type == "element_exists":
            # 检查是否存在特定元素
            try:
                element = await page.query_selector(indicator)
                return element is not None
            except Exception:
                return False
        
        return False
    
    def _extract_domain(self, url: str) -> str:
        """从 URL 提取域名"""
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc


class AuthService:
    """认证服务 - 整合认证引擎、缓存和凭证存储"""
    
    def __init__(self):
        """初始化认证服务"""
        self._engine = AuthEngine()
    
    async def get_cookie(self, provider_id: str, key: str) -> dict[str, str]:
        """
        获取认证 Cookie
        
        会先检查缓存，如果缓存存在则验证有效性，
        无效或不存在则重新认证。
        
        Args:
            provider_id: SSO 平台 ID
            key: 字段标识
            
        Returns:
            Cookie 字典
        """
        cache = get_cookie_cache()
        store = get_credential_store()
        
        # 获取 SSO 平台配置（异步）
        provider = await store.get_provider_with_credentials(provider_id)
        if not provider:
            raise AuthenticationError(f"SSO 平台 '{provider_id}' 不存在")
        
        # 获取字段账号
        field = None
        for f in provider.get("fields", []):
            if f.get("key") == key:
                field = f
                break
        
        if not field:
            raise AuthenticationError(f"字段 '{key}' 不存在于平台 '{provider_id}'")
        
        username = field.get("username")
        password = field.get("password")
        
        if not username or not password:
            raise AuthenticationError("用户名或密码未配置")
        
        # 检查缓存
        cached_cookies = cache.get(provider_id, key)
        
        if cached_cookies:
            logger.info(f"找到缓存的 Cookie: {provider_id}/{key}")
            
            # 验证 Cookie 有效性
            is_valid = await self._engine.validate_cookies(provider, cached_cookies)
            
            if is_valid:
                cache.mark_validated(provider_id, key)
                return cached_cookies
            else:
                # Cookie 失效，清除缓存
                cache.invalidate(provider_id, key)
                logger.info("缓存的 Cookie 已失效，需要重新认证")
        
        # 执行登录
        logger.info(f"正在执行登录: {provider_id}/{key}")
        cookies = await self._engine.login(provider, username, password)
        
        # 更新缓存
        cache.set(provider_id, key, cookies)
        
        return cookies
    
    async def close(self) -> None:
        """关闭认证服务"""
        await self._engine.close()


# 全局认证服务实例
_auth_service: AuthService | None = None


def get_auth_service() -> AuthService:
    """获取全局认证服务实例"""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service


async def close_auth_service() -> None:
    """关闭全局认证服务"""
    global _auth_service
    if _auth_service:
        await _auth_service.close()
        _auth_service = None
