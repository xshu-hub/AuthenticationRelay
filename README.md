# 认证中继服务 (Authentication Relay)

用于 Web 自动化脚本（如 Playwright）的 SSO 认证中继服务。通过模拟表单登录获取 Cookie，供自动化脚本使用。

## 功能特性

- **多 SSO 平台支持**: 动态配置多个 SSO 平台，无需修改代码
- **多账户管理**: 每个平台支持多个字段账号绑定
- **Cookie 缓存**: 内存缓存 Cookie，自动验证有效性
- **凭证加密**: 使用 Fernet 对称加密存储密码
- **MySQL 数据库**: 使用 MySQL 存储数据，支持自动迁移
- **审计日志**: 记录所有操作日志，支持查询和统计
- **Web 管理界面**: React 前端，方便配置管理
- **API Key 认证**: 保护 API 访问安全
- **用户角色区分**: 支持管理员和普通用户两种角色，权限分离

## 快速开始

### 1. 环境准备

**系统要求**：
- Python 3.12+
- MySQL 5.7+ 或 MySQL 8.0+
- Node.js 18+（前端开发需要）

**安装依赖**：

```bash
# 后端依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium

# 前端依赖（可选，用于开发）
cd web
npm install
```

**MySQL 准备**：

确保 MySQL 服务已运行。系统会在首次启动时自动创建数据库和表结构。

### 2. 配置

编辑 `config.yaml` 或通过环境变量配置：

```yaml
server:
  host: "0.0.0.0"
  port: 8000

# API 密钥配置（支持两种角色）
api_keys:
  admin: "your-admin-api-key-here"  # 管理员密钥
  user: "your-user-api-key-here"    # 普通用户密钥

# MySQL 数据库配置
database:
  host: "localhost"
  port: 3306
  user: "root"
  password: "your-password"
  database: "auth_relay"
  pool_size: 5
```

环境变量：
- `ADMIN_API_KEY`: 管理员 API 密钥
- `USER_API_KEY`: 普通用户 API 密钥
- `ENCRYPTION_KEY`: 加密密钥（可选，不设置会自动生成）
- `SERVER_HOST`: 服务器地址
- `SERVER_PORT`: 服务器端口
- `DB_HOST`: 数据库主机
- `DB_PORT`: 数据库端口
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称

> **注意**: 首次启动时，系统会自动创建数据库和表结构。如果存在旧的 JSON 数据文件，会自动迁移到数据库中。

### 3. 启动服务

```bash
# 开发模式
cd d:\project\AuthenticationRelay
python -m src.main

# 或使用 uvicorn
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 访问管理界面

打开浏览器访问 `http://localhost:8000`，输入 API Key 后即可使用管理界面。

## API 使用

### 认证

所有 API 请求需要在 Header 中携带 API Key：

```
X-API-Key: your-api-key-here
```

根据使用的 API Key 不同，会获得不同的权限（详见"用户角色"章节）。

### 获取认证 Cookie

```bash
# 普通用户或管理员都可以调用
curl -X POST http://localhost:8000/api/auth/cookie \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-user-api-key-here" \
  -d '{"provider_id": "sso_a", "key": "test1_user"}'
```

响应：

```json
{
  "provider_id": "sso_a",
  "key": "test1_user",
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": ".example.com",
      "path": "/",
      "httpOnly": true,
      "secure": true
    },
    {
      "name": "token",
      "value": "xyz789...",
      "domain": ".example.com",
      "path": "/"
    }
  ],
  "from_cache": false
}
```

### 在 Playwright 中使用

```python
import httpx
from playwright.sync_api import sync_playwright

# 获取 Cookie（返回完整的 Playwright 格式）
response = httpx.post(
    "http://localhost:8000/api/auth/cookie",
    headers={"X-API-Key": "your-secret-api-key-here"},
    json={"provider_id": "sso_a", "key": "test1_user"}
)
cookies = response.json()["cookies"]

# 在 Playwright 中使用
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    
    # 直接设置 Cookie（已包含 domain, path, expires 等完整信息）
    context.add_cookies(cookies)
    
    page = context.new_page()
    page.goto("https://app.example.com")
    # 现在已经是登录状态
```

## 用户角色

系统支持两种用户角色，通过不同的 API Key 区分：

| 角色 | API Key | 权限范围 |
|------|---------|----------|
| 管理员 (admin) | `api_keys.admin` | 全部功能（SSO 平台配置 + 字段管理 + 缓存管理） |
| 普通用户 (user) | `api_keys.user` | 字段账号增删改查、获取 Cookie、缓存管理 |

**典型使用场景**：
- **管理员**：通过 Web 界面配置 SSO 平台参数（选择器、URL 等）
- **普通用户**：通过 Web 界面管理字段账号（账户密码）
- **自动化脚本**：使用 `user_api_key` 调用 `/api/auth/cookie` 获取 Cookie

## API 端点

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/providers` | GET | 列出所有 SSO 平台 | 全部 |
| `/api/providers` | POST | 创建 SSO 平台 | 管理员 |
| `/api/providers/{id}` | GET | 获取平台详情 | 全部 |
| `/api/providers/{id}` | PUT | 更新平台配置 | 管理员 |
| `/api/providers/{id}` | DELETE | 删除平台 | 管理员 |
| `/api/providers/{id}/fields` | GET | 列出平台字段 | 全部 |
| `/api/providers/{id}/fields` | POST | 添加字段账号 | 全部 |
| `/api/providers/{id}/fields/{key}` | PUT | 更新字段账号 | 全部 |
| `/api/providers/{id}/fields/{key}` | DELETE | 删除字段账号 | 全部 |
| `/api/auth/cookie` | POST | 获取认证 Cookie | 全部 |
| `/api/auth/role` | GET | 获取当前用户角色 | 全部 |
| `/api/cache/stats` | GET | 获取缓存统计 | 全部 |
| `/api/cache` | DELETE | 清空所有缓存 | 全部 |
| `/api/logs` | GET | 查询审计日志（支持分页、筛选） | 管理员 |
| `/api/logs/stats` | GET | 获取日志统计信息 | 管理员 |

## SSO 平台配置说明

创建 SSO 平台时需要配置以下参数：

| 参数 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 平台唯一标识 |
| `name` | 是 | 平台显示名称 |
| `login_url` | 是 | 登录页面 URL |
| `username_selector` | 是 | 用户名输入框的 CSS 选择器 |
| `password_selector` | 是 | 密码输入框的 CSS 选择器 |
| `submit_selector` | 是 | 登录按钮的 CSS 选择器 |
| `success_indicator` | 否 | 登录成功的判断标识 |
| `success_indicator_type` | 否 | 标识类型: url_contains/url_equals/element_exists |
| `validate_url` | 否 | 用于验证 Cookie 有效性的 URL |
| `invalid_indicator` | 否 | Cookie 失效的判断标识 |
| `invalid_indicator_type` | 否 | 标识类型: status_code/url_contains/element_exists |
| `wait_after_login` | 否 | 登录后等待时间（毫秒），默认 2000 |

## 项目结构

```
AuthenticationRelay/
├── config.yaml           # 配置文件
├── requirements.txt      # Python 依赖
├── src/
│   ├── main.py           # 服务入口
│   ├── api/
│   │   ├── routes.py     # API 路由
│   │   └── models.py     # 数据模型
│   ├── auth/
│   │   └── engine.py     # 认证引擎
│   ├── storage/
│   │   ├── database.py   # MySQL 数据库模块
│   │   ├── credential.py # 凭证存储
│   │   ├── cookie_cache.py # Cookie 缓存
│   │   └── audit_log.py  # 审计日志服务
│   └── utils/
│       ├── config.py     # 配置加载
│       └── crypto.py     # 加密工具
├── web/                  # React 前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.tsx  # 管理员仪表盘
│   │   │   │   ├── Providers.tsx  # SSO 平台管理
│   │   │   │   └── Logs.tsx       # 操作日志页面
│   │   │   └── user/
│   │   └── ...
│   └── package.json
└── data/                 # 数据存储目录（加密密钥等）
```

## 审计日志

系统会自动记录所有 API 操作，包括：

- **Provider 操作**: 创建、更新、删除 SSO 平台
- **Field 操作**: 创建、更新、删除字段账号
- **认证操作**: 认证请求、成功、失败
- **缓存操作**: 清空缓存

### 查询日志

管理员可以通过 API 或 Web 界面查询日志：

```bash
# 查询日志列表
curl -X GET "http://localhost:8000/api/logs?page=1&page_size=20" \
  -H "X-API-Key: your-admin-api-key"

# 按操作类型筛选
curl -X GET "http://localhost:8000/api/logs?action=provider.create" \
  -H "X-API-Key: your-admin-api-key"

# 获取日志统计
curl -X GET "http://localhost:8000/api/logs/stats" \
  -H "X-API-Key: your-admin-api-key"
```

### 日志筛选参数

| 参数 | 说明 |
|------|------|
| `page` | 页码（从 1 开始） |
| `page_size` | 每页数量（1-100） |
| `action` | 操作类型（如 `provider.create`） |
| `resource_type` | 资源类型（`provider`/`field`/`auth`/`cache`） |
| `resource_id` | 资源标识 |
| `success` | 是否成功（`true`/`false`） |
| `start_time` | 开始时间（ISO 格式） |
| `end_time` | 结束时间（ISO 格式） |

## 开发

### 前端开发

```bash
cd web
npm run dev
```

前端开发服务器运行在 `http://localhost:3000`，会自动代理 API 请求到后端。

### 构建前端

```bash
cd web
npm run build
```

构建产物在 `web/dist/`，后端服务会自动托管。

## 安全注意事项

1. **修改默认 API Key**: 生产环境务必修改 `config.yaml` 中的 `api_keys.admin` 和 `api_keys.user`
2. **权限最小化**: 自动化脚本应使用 `user_api_key`，仅管理员使用 `admin_api_key`
3. **限制网络访问**: 建议只在内网或通过 VPN 访问
4. **定期更换密码**: 定期更新 SSO 账号密码
5. **日志脱敏**: 生产环境建议调整日志级别，避免敏感信息泄露

## License

MIT
