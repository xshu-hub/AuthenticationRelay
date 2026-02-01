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
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">平台列表</h1>
        <div className="text-sm text-gray-500">
          共 {providers.length} 个平台
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 平台卡片列表 */}
      {providers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          暂无可用的 SSO 平台
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <Link
              key={provider.id}
              to={`/providers/${provider.id}`}
              className="block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {provider.id}</p>
                  <p className="text-xs text-gray-400 mt-2 truncate max-w-xs">
                    {provider.login_url}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    {provider.field_count} 个字段
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600 hover:text-gray-800">
                  管理字段账号 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
