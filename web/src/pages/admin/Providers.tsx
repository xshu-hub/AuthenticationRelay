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
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">SSO 平台管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
        >
          添加平台
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 添加平台表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">添加 SSO 平台</h2>
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
        <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
          暂无 SSO 平台，点击"添加平台"创建第一个
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  登录 URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  字段数量
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    <Link
                      to={`/providers/${provider.id}`}
                      className="text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      {provider.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {provider.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {provider.login_url}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {provider.field_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      to={`/providers/${provider.id}`}
                      className="text-slate-600 hover:text-slate-800 mr-4"
                    >
                      详情
                    </Link>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-600 hover:text-red-800"
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
