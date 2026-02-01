import { Routes, Route } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { setApiKey, authApi } from './api/client';
import type { UserRole } from './types';

// 布局组件
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

// 管理员页面
import AdminDashboard from './pages/admin/Dashboard';
import AdminProviders from './pages/admin/Providers';
import AdminProviderDetail from './pages/admin/ProviderDetail';

// 用户页面
import UserHome from './pages/user/Home';
import UserProviders from './pages/user/Providers';
import UserProviderDetail from './pages/user/ProviderDetail';

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

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('userRole');
    setIsConfigured(false);
    setApiKeyInput('');
    setRole(null);
  };

  // 登录页面
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">认证中继服务</h1>
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
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
            disabled={isLoading}
          />
          <button
            onClick={handleSaveApiKey}
            disabled={isLoading}
            className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? '验证中...' : '确认'}
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  // 根据角色渲染不同的布局和路由
  return (
    <AuthContext.Provider value={{ role, isAdmin }}>
      {isAdmin ? (
        // 管理员后台 - 侧边栏布局
        <AdminLayout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/providers" element={<AdminProviders />} />
            <Route path="/providers/:id" element={<AdminProviderDetail />} />
          </Routes>
        </AdminLayout>
      ) : (
        // 用户前台 - 顶部导航布局
        <UserLayout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<UserHome />} />
            <Route path="/providers" element={<UserProviders />} />
            <Route path="/providers/:id" element={<UserProviderDetail />} />
          </Routes>
        </UserLayout>
      )}
    </AuthContext.Provider>
  );
}

export default App;
