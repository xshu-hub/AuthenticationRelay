import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { providersApi } from '../../api/client';
import type { SSOProviderListItem, SSOProviderCreate } from '../../types';
import ProviderForm from '../../components/ProviderForm';

export default function AdminProviders() {
  const [providers, setProviders] = useState<SSOProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

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

  const handleCreate = async (data: SSOProviderCreate) => {
    try {
      await providersApi.create(data);
      setShowForm(false);
      await loadProviders();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`确定要删除平台 "${id}" 吗？这将同时删除其下所有字段账号。`)) {
      return;
    }
    try {
      await providersApi.delete(id);
      await loadProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
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
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">SSO 平台管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理所有接入的单点登录平台及其配置</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors shadow-sm text-sm font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加平台
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 添加平台表单 Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 border border-neutral-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900">添加 SSO 平台</h2>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ProviderForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 平台列表 */}
      {providers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">暂无 SSO 平台</h3>
          <p className="text-neutral-500 mb-6">开始添加您的第一个认证平台</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium text-sm transition-colors"
          >
            立即添加
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  登录 URL
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  字段数量
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                    <Link
                      to={`/providers/${provider.id}`}
                      className="hover:text-blue-600 hover:underline decoration-blue-600/30 underline-offset-4"
                    >
                      {provider.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {provider.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500 max-w-xs truncate font-mono text-xs">
                    {provider.login_url}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                      {provider.field_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      to={`/providers/${provider.id}`}
                      className="text-neutral-600 hover:text-neutral-900 font-medium mr-4 transition-colors"
                    >
                      详情
                    </Link>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-600 hover:text-red-800 font-medium transition-colors"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
