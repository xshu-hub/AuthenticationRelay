import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { setApiKey } from './api/client';
import type { UserRole } from './types';

// 布局组件
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

// 页面组件
import Login from './pages/Login';

// 管理员页面
import AdminDashboard from './pages/admin/Dashboard';
import AdminProviders from './pages/admin/Providers';
import AdminProviderDetail from './pages/admin/ProviderDetail';
import AdminLogs from './pages/admin/Logs';

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
  const [isConfigured, setIsConfigured] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedKey = localStorage.getItem('apiKey');
    const savedRole = localStorage.getItem('userRole') as UserRole | null;
    if (savedKey && savedRole) {
      setApiKey(savedKey);
      setRole(savedRole);
      setIsConfigured(true);
    }
  }, []);

  const handleLoginSuccess = (userRole: UserRole) => {
    setRole(userRole);
    setIsConfigured(true);
    // 登录成功后导航到首页
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('userRole');
    setIsConfigured(false);
    setRole(null);
    // 登出后导航到首页（会显示登录页）
    navigate('/', { replace: true });
  };

  // 登录页面
  if (!isConfigured) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
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
            <Route path="/logs" element={<AdminLogs />} />
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
