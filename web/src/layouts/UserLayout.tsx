import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface UserLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function UserLayout({ children, onLogout }: UserLayoutProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-200 text-gray-900'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-between h-14">
            {/* 左侧：Logo 和导航 */}
            <div className="flex items-center">
              <span className="text-lg font-semibold text-gray-800">认证中继</span>
              <div className="ml-8 flex space-x-2">
                <NavLink to="/" className={navLinkClass} end>
                  首页
                </NavLink>
                <NavLink to="/providers" className={navLinkClass}>
                  平台列表
                </NavLink>
              </div>
            </div>

            {/* 右侧：角色标识和退出 */}
            <div className="flex items-center space-x-4">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                普通用户
              </span>
              <button
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-5xl mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}
