import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import ProviderDetail from './pages/ProviderDetail';
import { useState, useEffect, createContext, useContext } from 'react';
import { setApiKey, authApi } from './api/client';
import type { UserRole } from './types';

// 用户角色 Context
interface AuthContextType {
  role: UserRole | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ role: null, isAdmin: false });

export const useAuth = () => useContext(AuthContext);

function App() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('apiKey');
    const savedRole = localStorage.getItem('userRole') as UserRole | null;
    if (savedKey && savedRole) {
      setRole(savedRole);
      setIsConfigured(true);
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    
    setIsLoading(true);
    setLoginError('');
    
    // 先设置 API Key
    setApiKey(apiKeyInput.trim());
    
    try {
      // 验证 API Key 并获取角色
      const response = await authApi.getRole();
      localStorage.setItem('userRole', response.role);
      setRole(response.role);
      setIsConfigured(true);
    } catch (err) {
      // 验证失败，清除 API Key
      localStorage.removeItem('apiKey');
      setLoginError(err instanceof Error ? err.message : '验证失败，请检查 API Key');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">认证中继服务</h1>
          <p className="text-gray-600 mb-4">请输入 API Key 以访问管理界面：</p>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {loginError}
            </div>
          )}
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="输入 API Key"
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
            disabled={isLoading}
          />
          <button
            onClick={handleSaveApiKey}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? '验证中...' : '确认'}
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ role, isAdmin }}>
      <div className="min-h-screen bg-gray-100">
        {/* 导航栏 */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-gray-800">认证中继服务</span>
                <div className="ml-10 flex space-x-4">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    仪表盘
                  </NavLink>
                  <NavLink
                    to="/providers"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    SSO 平台
                  </NavLink>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`text-xs px-2 py-1 rounded ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isAdmin ? '管理员' : '普通用户'}
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('apiKey');
                    localStorage.removeItem('userRole');
                    setIsConfigured(false);
                    setApiKeyInput('');
                    setRole(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/providers/:id" element={<ProviderDetail />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
