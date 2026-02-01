import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-slate-700 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* 侧边栏 */}
      <aside className="w-60 bg-slate-800 flex flex-col">
        {/* Logo/标题 + 管理员标签 */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700">
          <span className="text-lg font-bold text-white">认证中继服务</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded">
            管理员
          </span>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavLink to="/" className={navLinkClass} end>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            仪表盘
          </NavLink>
          <NavLink to="/providers" className={navLinkClass}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            SSO 平台
          </NavLink>
        </nav>

        {/* 底部退出按钮 */}
        <div className="px-4 py-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto py-6 px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
