import { useState } from 'react';
import { setApiKey, authApi } from '../api/client';
import type { UserRole } from '../types';

interface LoginProps {
  onLoginSuccess: (role: UserRole) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    if (!apiKeyInput.trim()) return;
    
    setIsLoading(true);
    setLoginError('');
    
    // 先设置 API Key
    setApiKey(apiKeyInput.trim());
    
    try {
      // 验证 API Key 并获取角色
      const response = await authApi.getRole();
      
      // 保存到 localStorage
      localStorage.setItem('apiKey', apiKeyInput.trim());
      localStorage.setItem('userRole', response.role);
      
      onLoginSuccess(response.role);
    } catch (err) {
      // 验证失败，清除 API Key
      localStorage.removeItem('apiKey');
      setLoginError(err instanceof Error ? err.message : '验证失败，请检查 API Key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md transition-all duration-300 hover:shadow-md">
        <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">认证中继服务</h1>
            <p className="text-secondary mt-2 text-sm">请输入 API Key 进行身份验证</p>
        </div>

        {loginError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-start animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <span>{loginError}</span>
          </div>
        )}

        <div className="space-y-5">
            <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-primary mb-1.5">API Key</label>
                <div className="relative group">
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="sk-..."
                        className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800 placeholder-gray-400 group-hover:border-gray-300"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        disabled={isLoading}
                    />
                </div>
            </div>
            
            <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow active:scale-[0.98] duration-200 flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        验证中...
                    </>
                ) : '确认访问'}
            </button>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
                Authentication Relay Service &copy; {new Date().getFullYear()}
            </p>
        </div>
      </div>
    </div>
  );
}
