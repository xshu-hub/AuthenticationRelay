import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface UserLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function UserLayout({ children, onLogout }: UserLayoutProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
      isActive
        ? 'bg-neutral-900 text-white shadow-sm'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo and Nav */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                   <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-neutral-900 tracking-tight">AuthRelay</span>
              </div>
              <div className="hidden md:flex space-x-1">
                <NavLink to="/" className={navLinkClass} end>
                  首页
                </NavLink>
                <NavLink to="/providers" className={navLinkClass}>
                  平台列表
                </NavLink>
              </div>
            </div>

            {/* Right: User Info and Logout */}
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                普通用户
              </span>
              <div className="h-6 w-px bg-neutral-200"></div>
              <button
                onClick={onLogout}
                className="text-sm font-medium text-neutral-500 hover:text-red-600 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
