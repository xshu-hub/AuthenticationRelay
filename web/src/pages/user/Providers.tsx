import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { providersApi } from '../../api/client';
import type { SSOProviderListItem } from '../../types';

export default function UserProviders() {
  const [providers, setProviders] = useState<SSOProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await providersApi.list();
      setProviders(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">平台列表</h1>
          <p className="text-sm text-neutral-500 mt-1">选择一个平台以管理其字段账号</p>
        </div>
        <div className="px-3 py-1 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 shadow-sm">
          共 {providers.length} 个平台
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 平台卡片列表 */}
      {providers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">暂无可用的 SSO 平台</h3>
          <p className="text-neutral-500">请联系管理员添加平台</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Link
              key={provider.id}
              to={`/providers/${provider.id}`}
              className="group block bg-white rounded-xl shadow-sm border border-neutral-100 p-6 hover:shadow-md hover:border-neutral-200 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-600 font-bold text-lg group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                  {provider.name.substring(0, 1).toUpperCase()}
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                  {provider.field_count} 个字段
                </span>
              </div>
              
              <div>
                <h3 className="font-bold text-neutral-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{provider.name}</h3>
                <p className="text-sm text-neutral-500 font-mono mb-3">{provider.id}</p>
                <div className="flex items-center text-xs text-neutral-400 truncate">
                  <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="truncate">{provider.login_url}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
