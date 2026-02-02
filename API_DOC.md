# AuthenticationRelay API 文档

## 认证方式

所有 API 请求需要在 Header 中携带 API Key：

```
X-API-Key: your-api-key-here
```

系统支持两种角色：

| 角色 | 权限范围 |
|------|----------|
| **admin** | 全部功能 |
| **user** | 字段账号管理、获取 Cookie、缓存管理 |

---

## API 端点总览

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/providers` | GET | 列出所有 SSO 平台 | 全部 |
| `/api/providers` | POST | 创建 SSO 平台 | 管理员 |
| `/api/providers/{provider_id}` | GET | 获取平台详情 | 全部 |
| `/api/providers/{provider_id}` | PUT | 更新平台配置 | 管理员 |
| `/api/providers/{provider_id}` | DELETE | 删除平台 | 管理员 |
| `/api/providers/{provider_id}/fields` | GET | 列出平台字段 | 全部 |
| `/api/providers/{provider_id}/fields` | POST | 添加字段账号 | 全部 |
| `/api/providers/{provider_id}/fields/{key}` | GET | 获取字段详情 | 全部 |
| `/api/providers/{provider_id}/fields/{key}` | PUT | 更新字段账号 | 全部 |
| `/api/providers/{provider_id}/fields/{key}` | DELETE | 删除字段账号 | 全部 |
| `/api/auth/cookie` | POST | 获取认证 Cookie | 全部 |
| `/api/auth/role` | GET | 获取当前用户角色 | 全部 |
| `/api/cache/stats` | GET | 获取缓存统计 | 全部 |
| `/api/cache` | DELETE | 清空所有缓存 | 全部 |
| `/api/cache/{provider_id}` | DELETE | 清空平台缓存 | 全部 |
| `/api/cache/{provider_id}/{key}` | DELETE | 清空字段缓存 | 全部 |
| `/api/logs` | GET | 查询审计日志 | 管理员 |
| `/api/logs/stats` | GET | 获取日志统计 | 管理员 |

---

## SSO 平台管理 (Providers)

### GET /api/providers

**列出所有 SSO 平台**

**响应示例：**

```json
[
  {
    "id": "sso_a",
    "name": "SSO 平台 A",
    "login_url": "https://sso.example.com/login",
    "field_count": 3,
    "created_at": "2026-01-01T00:00:00",
    "updated_at": "2026-01-02T00:00:00"
  }
]
```

---

### POST /api/providers

**创建 SSO 平台**（需要管理员权限）

**请求体：**

```json
{
  "id": "sso_a",
  "name": "SSO 平台 A",
  "login_url": "https://sso.example.com/login",
  "username_selector": "#username",
  "password_selector": "#password",
  "submit_selector": "#submit",
  "success_indicator": "/dashboard",
  "success_indicator_type": "url_contains",
  "validate_url": "https://sso.example.com/api/user",
  "invalid_indicator": "/login",
  "invalid_indicator_type": "url_contains",
  "wait_after_login": 2000
}
```

**请求参数说明：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `id` | string | 是 | 平台唯一标识 |
| `name` | string | 是 | 平台显示名称 |
| `login_url` | string | 是 | 登录页面 URL |
| `username_selector` | string | 是 | 用户名输入框 CSS 选择器 |
| `password_selector` | string | 是 | 密码输入框 CSS 选择器 |
| `submit_selector` | string | 是 | 登录按钮 CSS 选择器 |
| `success_indicator` | string | 否 | 登录成功判断标识 |
| `success_indicator_type` | string | 否 | 标识类型: `url_contains` / `url_equals` / `element_exists` |
| `validate_url` | string | 否 | 验证 Cookie 有效性的 URL |
| `invalid_indicator` | string | 否 | Cookie 失效判断标识 |
| `invalid_indicator_type` | string | 否 | 标识类型: `status_code` / `url_contains` / `element_exists` |
| `wait_after_login` | int | 否 | 登录后等待时间(ms)，默认 2000 |

**响应示例：**

```json
{
  "id": "sso_a",
  "name": "SSO 平台 A",
  "login_url": "https://sso.example.com/login",
  "username_selector": "#username",
  "password_selector": "#password",
  "submit_selector": "#submit",
  "success_indicator": "/dashboard",
  "success_indicator_type": "url_contains",
  "validate_url": "https://sso.example.com/api/user",
  "invalid_indicator": "/login",
  "invalid_indicator_type": "url_contains",
  "wait_after_login": 2000,
  "fields": [],
  "created_at": "2026-02-02T10:00:00",
  "updated_at": "2026-02-02T10:00:00"
}
```

---

### GET /api/providers/{provider_id}

**获取 SSO 平台详情**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |

**响应示例：**

```json
{
  "id": "sso_a",
  "name": "SSO 平台 A",
  "login_url": "https://sso.example.com/login",
  "username_selector": "#username",
  "password_selector": "#password",
  "submit_selector": "#submit",
  "success_indicator": "/dashboard",
  "success_indicator_type": "url_contains",
  "validate_url": null,
  "invalid_indicator": null,
  "invalid_indicator_type": "url_contains",
  "wait_after_login": 2000,
  "fields": [
    {
      "key": "user1",
      "username": "testuser",
      "created_at": "2026-01-01T00:00:00",
      "updated_at": "2026-01-01T00:00:00"
    }
  ],
  "created_at": "2026-01-01T00:00:00",
  "updated_at": "2026-01-02T00:00:00"
}
```

---

### PUT /api/providers/{provider_id}

**更新 SSO 平台**（需要管理员权限）

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |

**请求体：**（所有字段可选，只传需要更新的字段）

```json
{
  "name": "新名称",
  "login_url": "https://new-sso.example.com/login"
}
```

**可更新字段：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `name` | string | 平台显示名称 |
| `login_url` | string | 登录页面 URL |
| `username_selector` | string | 用户名输入框 CSS 选择器 |
| `password_selector` | string | 密码输入框 CSS 选择器 |
| `submit_selector` | string | 登录按钮 CSS 选择器 |
| `success_indicator` | string | 登录成功判断标识 |
| `success_indicator_type` | string | 标识类型 |
| `validate_url` | string | 验证 Cookie 有效性的 URL |
| `invalid_indicator` | string | Cookie 失效判断标识 |
| `invalid_indicator_type` | string | 标识类型 |
| `wait_after_login` | int | 登录后等待时间(ms) |

**响应：** 返回更新后的完整平台信息

---

### DELETE /api/providers/{provider_id}

**删除 SSO 平台**（需要管理员权限）

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |

**响应示例：**

```json
{
  "success": true,
  "message": "Provider 'sso_a' deleted"
}
```

---

## 字段账号管理 (Fields)

### GET /api/providers/{provider_id}/fields

**列出平台下所有字段账号**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |

**响应示例：**

```json
[
  {
    "key": "user1",
    "username": "testuser",
    "created_at": "2026-01-01T00:00:00",
    "updated_at": "2026-01-01T00:00:00"
  }
]
```

---

### POST /api/providers/{provider_id}/fields

**创建字段账号**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |

**请求体：**

```json
{
  "key": "user1",
  "username": "testuser",
  "password": "secret123"
}
```

**请求参数说明：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `key` | string | 是 | 字段标识（唯一） |
| `username` | string | 是 | 登录用户名 |
| `password` | string | 是 | 登录密码（加密存储） |

**响应示例：**

```json
{
  "key": "user1",
  "username": "testuser",
  "created_at": "2026-02-02T10:00:00",
  "updated_at": "2026-02-02T10:00:00"
}
```

---

### GET /api/providers/{provider_id}/fields/{key}

**获取字段详情**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |
| `key` | string | 字段标识 |

**响应示例：**

```json
{
  "key": "user1",
  "username": "testuser",
  "created_at": "2026-01-01T00:00:00",
  "updated_at": "2026-01-01T00:00:00"
}
```

---

### PUT /api/providers/{provider_id}/fields/{key}

**更新字段账号**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |
| `key` | string | 字段标识 |

**请求体：**（所有字段可选）

```json
{
  "username": "newuser",
  "password": "newpassword"
}
```

**可更新字段：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `username` | string | 登录用户名 |
| `password` | string | 登录密码 |

**响应：** 返回更新后的字段信息

---

### DELETE /api/providers/{provider_id}/fields/{key}

**删除字段账号**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |
| `key` | string | 字段标识 |

**响应示例：**

```json
{
  "success": true,
  "message": "Field 'user1' deleted"
}
```

---

## 认证 (Auth)

### POST /api/auth/cookie

**获取认证 Cookie**

会自动检查缓存并验证有效性，失效时自动重新认证。

**请求体：**

```json
{
  "provider_id": "sso_a",
  "key": "user1"
}
```

**请求参数说明：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `provider_id` | string | 是 | SSO 平台 ID |
| `key` | string | 是 | 字段标识 |

**响应示例：**

```json
{
  "provider_id": "sso_a",
  "key": "user1",
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": ".example.com",
      "path": "/",
      "expires": 1735689600,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    },
    {
      "name": "token",
      "value": "xyz789...",
      "domain": ".example.com",
      "path": "/",
      "secure": true
    }
  ],
  "from_cache": false
}
```

**响应字段说明：**

| 字段 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | SSO 平台 ID |
| `key` | string | 字段标识 |
| `cookies` | array | Cookie 列表（Playwright 格式） |
| `from_cache` | boolean | 是否来自缓存 |

**Cookie 项字段说明：**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `name` | string | 是 | Cookie 名称 |
| `value` | string | 是 | Cookie 值 |
| `domain` | string | 是 | Cookie 域名 |
| `path` | string | 是 | Cookie 路径 |
| `expires` | number | 否 | 过期时间（Unix 时间戳，秒） |
| `httpOnly` | boolean | 否 | HttpOnly 标记 |
| `secure` | boolean | 否 | Secure 标记 |
| `sameSite` | string | 否 | SameSite 属性（Strict/Lax/None） |

---

### GET /api/auth/role

**获取当前用户角色**

**响应示例：**

```json
{
  "role": "admin"
}
```

**可能的角色值：**
- `admin` - 管理员
- `user` - 普通用户

---

## 缓存管理 (Cache)

### GET /api/cache/stats

**获取缓存统计信息**

**响应示例：**

```json
{
  "total_entries": 5,
  "providers": {
    "sso_a": 3,
    "sso_b": 2
  }
}
```

**响应字段说明：**

| 字段 | 类型 | 描述 |
|------|------|------|
| `total_entries` | int | 缓存条目总数 |
| `providers` | object | 各平台缓存条目数 |

---

### DELETE /api/cache

**清空所有缓存**

**响应示例：**

```json
{
  "success": true,
  "message": "Cleared 5 cache entries"
}
```

---

### DELETE /api/cache/{provider_id}

**清空指定平台的缓存**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |

**响应示例：**

```json
{
  "success": true,
  "message": "Cleared 3 cache entries for provider 'sso_a'"
}
```

---

### DELETE /api/cache/{provider_id}/{key}

**清空指定字段的缓存**

**路径参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `provider_id` | string | 平台 ID |
| `key` | string | 字段标识 |

**响应示例：**

```json
{
  "success": true,
  "message": "Cache cleared for 'sso_a/user1'"
}
```

---

## 审计日志 (Logs)

### GET /api/logs

**查询审计日志**（需要管理员权限）

**查询参数：**

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `page` | int | 1 | 页码（从 1 开始） |
| `page_size` | int | 20 | 每页数量（1-100） |
| `action` | string | - | 按操作类型筛选 |
| `resource_type` | string | - | 按资源类型筛选 |
| `resource_id` | string | - | 按资源 ID 筛选 |
| `success` | boolean | - | 按成功状态筛选 |
| `start_time` | datetime | - | 开始时间（ISO 格式） |
| `end_time` | datetime | - | 结束时间（ISO 格式） |

**操作类型 (action) 枚举值：**

| 值 | 描述 |
|------|------|
| `provider.list` | 列出平台 |
| `provider.create` | 创建平台 |
| `provider.update` | 更新平台 |
| `provider.delete` | 删除平台 |
| `field.create` | 创建字段 |
| `field.update` | 更新字段 |
| `field.delete` | 删除字段 |
| `auth.request` | 认证请求 |
| `auth.success` | 认证成功 |
| `auth.failure` | 认证失败 |
| `cache.clear` | 清空缓存 |

**资源类型 (resource_type) 枚举值：**

| 值 | 描述 |
|------|------|
| `provider` | SSO 平台 |
| `field` | 字段账号 |
| `auth` | 认证 |
| `cache` | 缓存 |

**响应示例：**

```json
{
  "items": [
    {
      "id": 1,
      "timestamp": "2026-02-02T10:00:00",
      "action": "provider.create",
      "resource_type": "provider",
      "resource_id": "sso_a",
      "user_role": "admin",
      "ip_address": "192.168.1.100",
      "details": {"name": "SSO 平台 A"},
      "success": true
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

**响应字段说明：**

| 字段 | 类型 | 描述 |
|------|------|------|
| `items` | array | 日志条目列表 |
| `total` | int | 总条目数 |
| `page` | int | 当前页码 |
| `page_size` | int | 每页数量 |

**日志条目字段：**

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | int | 日志 ID |
| `timestamp` | string | 时间戳 |
| `action` | string | 操作类型 |
| `resource_type` | string | 资源类型 |
| `resource_id` | string | 资源标识 |
| `user_role` | string | 用户角色 |
| `ip_address` | string | 客户端 IP |
| `details` | object | 详细信息 |
| `success` | boolean | 是否成功 |

---

### GET /api/logs/stats

**获取日志统计信息**（需要管理员权限）

**查询参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| `start_time` | datetime | 统计开始时间（ISO 格式） |
| `end_time` | datetime | 统计结束时间（ISO 格式） |

**响应示例：**

```json
{
  "total": 100,
  "success_count": 95,
  "failure_count": 5,
  "by_action": {
    "provider.create": 10,
    "auth.request": 50,
    "auth.success": 35
  },
  "by_resource_type": {
    "provider": 20,
    "field": 30,
    "auth": 50
  },
  "by_role": {
    "admin": 40,
    "user": 60
  }
}
```

**响应字段说明：**

| 字段 | 类型 | 描述 |
|------|------|------|
| `total` | int | 总日志数 |
| `success_count` | int | 成功操作数 |
| `failure_count` | int | 失败操作数 |
| `by_action` | object | 按操作类型统计 |
| `by_resource_type` | object | 按资源类型统计 |
| `by_role` | object | 按用户角色统计 |

---

## 错误响应

所有错误响应格式：

```json
{
  "detail": "错误描述信息"
}
```

**常见 HTTP 状态码：**

| 状态码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | API Key 缺失或无效 |
| 403 | 权限不足（需要管理员权限） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用示例

### cURL 示例

**获取认证 Cookie：**

```bash
curl -X POST http://localhost:8000/api/auth/cookie \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"provider_id": "sso_a", "key": "user1"}'
```

**创建 SSO 平台：**

```bash
curl -X POST http://localhost:8000/api/providers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-admin-api-key" \
  -d '{
    "id": "sso_a",
    "name": "SSO 平台 A",
    "login_url": "https://sso.example.com/login",
    "username_selector": "#username",
    "password_selector": "#password",
    "submit_selector": "#submit"
  }'
```

**查询审计日志：**

```bash
curl -X GET "http://localhost:8000/api/logs?page=1&page_size=20&action=auth.success" \
  -H "X-API-Key: your-admin-api-key"
```

### Python 示例

```python
import httpx

API_BASE = "http://localhost:8000/api"
API_KEY = "your-api-key"

headers = {"X-API-Key": API_KEY}

# 获取认证 Cookie
response = httpx.post(
    f"{API_BASE}/auth/cookie",
    headers=headers,
    json={"provider_id": "sso_a", "key": "user1"}
)
cookies = response.json()["cookies"]
# cookies 是完整的 Playwright 格式列表
print(cookies)
```

### Playwright 集成示例

```python
import httpx
from playwright.sync_api import sync_playwright

# 获取 Cookie（返回的是完整的 Playwright 格式）
response = httpx.post(
    "http://localhost:8000/api/auth/cookie",
    headers={"X-API-Key": "your-api-key"},
    json={"provider_id": "sso_a", "key": "user1"}
)
cookies = response.json()["cookies"]

# 在 Playwright 中使用（直接使用，无需转换）
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    
    # 直接设置 Cookie（已包含 domain, path, expires 等完整信息）
    context.add_cookies(cookies)
    
    page = context.new_page()
    page.goto("https://app.example.com")
    # 现在已经是登录状态
```

### 异步 Playwright 示例

```python
import httpx
from playwright.async_api import async_playwright

async def main():
    # 获取 Cookie
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/auth/cookie",
            headers={"X-API-Key": "your-api-key"},
            json={"provider_id": "sso_a", "key": "user1"}
        )
        cookies = response.json()["cookies"]
    
    # 在 Playwright 中使用
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        
        # 直接设置完整的 Cookie
        await context.add_cookies(cookies)
        
        page = await context.new_page()
        await page.goto("https://app.example.com")
        # 现在已经是登录状态
```
