# 认证中继服务 (Authentication Relay)

用于 Web 自动化脚本（如 Playwright）的 SSO 认证中继服务。通过模拟表单登录获取 Cookie，供自动化脚本使用。

## 功能特性

- **多 SSO 平台支持**: 动态配置多个 SSO 平台，无需修改代码
- **多账户管理**: 每个平台支持多个字段账号绑定
- **Cookie 缓存**: 内存缓存 Cookie，自动验证有效性
- **凭证加密**: 使用 Fernet 对称加密存储密码
- **Web 管理界面**: React 前端，方便配置管理
- **API Key 认证**: 保护 API 访问安全

## 快速开始

### 1. 安装依赖

```bash
# 后端依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium

# 前端依赖（可选，用于开发）
cd web
npm install
```

### 2. 配置

编辑 `config.yaml` 或通过环境变量配置：

```yaml
server:
  host: "0.0.0.0"
  port: 8000

api_key: "your-secret-api-key-here"  # 修改为安全的 API Key
```

环境变量：
- `API_KEY`: API 访问密钥
- `ENCRYPTION_KEY`: 加密密钥（可选，不设置会自动生成）
- `SERVER_HOST`: 服务器地址
- `SERVER_PORT`: 服务器端口

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
X-API-Key: your-secret-api-key-here
```

### 获取认证 Cookie

```bash
curl -X POST http://localhost:8000/api/auth/cookie \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{"provider_id": "sso_a", "key": "test1_user"}'
```

响应：

```json
{
  "provider_id": "sso_a",
  "key": "test1_user",
  "cookies": {
    "session_id": "abc123...",
    "token": "xyz789..."
  },
  "from_cache": false
}
```

### 在 Playwright 中使用

```python
import httpx
from playwright.sync_api import sync_playwright

# 获取 Cookie
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
    
    # 设置 Cookie
    for name, value in cookies.items():
        context.add_cookies([{
            "name": name,
            "value": value,
            "domain": ".example.com",  # 根据实际域名修改
            "path": "/"
        }])
    
    page = context.new_page()
    page.goto("https://app.example.com")
    # 现在已经是登录状态
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/providers` | GET | 列出所有 SSO 平台 |
| `/api/providers` | POST | 创建 SSO 平台 |
| `/api/providers/{id}` | GET | 获取平台详情 |
| `/api/providers/{id}` | PUT | 更新平台配置 |
| `/api/providers/{id}` | DELETE | 删除平台 |
| `/api/providers/{id}/fields` | GET | 列出平台字段 |
| `/api/providers/{id}/fields` | POST | 添加字段账号 |
| `/api/providers/{id}/fields/{key}` | PUT | 更新字段账号 |
| `/api/providers/{id}/fields/{key}` | DELETE | 删除字段账号 |
| `/api/auth/cookie` | POST | 获取认证 Cookie |
| `/api/cache/stats` | GET | 获取缓存统计 |
| `/api/cache` | DELETE | 清空所有缓存 |

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
│   │   ├── credential.py # 凭证存储
│   │   └── cookie_cache.py # Cookie 缓存
│   └── utils/
│       ├── config.py     # 配置加载
│       └── crypto.py     # 加密工具
├── web/                  # React 前端
│   ├── src/
│   └── package.json
└── data/                 # 数据存储目录（自动创建）
```

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

1. **修改默认 API Key**: 生产环境务必修改 `config.yaml` 中的 `api_key`
2. **限制网络访问**: 建议只在内网或通过 VPN 访问
3. **定期更换密码**: 定期更新 SSO 账号密码
4. **日志脱敏**: 生产环境建议调整日志级别，避免敏感信息泄露

## License

MIT
