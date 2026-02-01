import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { providersApi, authApi } from '../../api/client';
import type { SSOProviderListItem } from '../../types';

export default function UserHome() {
  const [providers, setProviders] = useState<SSOProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 认证测试状态
  const [testProviderId, setTestProviderId] = useState('');
  const [testKey, setTestKey] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const providersData = await providersApi.list();
      setProviders(providersData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAuth = async () => {
    if (!testProviderId || !testKey) {
      setTestResult('请输入平台 ID 和字段 Key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await authApi.getCookie({
        provider_id: testProviderId,
        key: testKey,
      });
      setTestResult(`认证成功！获取到 ${Object.keys(result.cookies).length} 个 Cookie${result.from_cache ? '（来自缓存）' : ''}`);
    } catch (err) {
      setTestResult(`认证失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const totalFields = providers.reduce((sum, p) => sum + p.field_count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">首页</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 快速统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">可用平台</div>
              <div className="text-2xl font-bold text-gray-700">{providers.length}</div>
            </div>
            <Link
              to="/providers"
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
            >
              查看全部
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">字段账号总数</div>
          <div className="text-2xl font-bold text-gray-700">{totalFields}</div>
        </div>
      </div>

      {/* 认证测试 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快速认证测试</h2>
        <p className="text-sm text-gray-500 mb-4">
          输入平台 ID 和字段 Key，测试获取认证 Cookie
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm text-gray-600 mb-1">平台 ID</label>
            <select
              value={testProviderId}
              onChange={(e) => setTestProviderId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">选择平台...</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-sm text-gray-600 mb-1">字段 Key</label>
            <input
              type="text"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder="如: test1_user"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <button
            onClick={handleTestAuth}
            disabled={testing}
            className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {testing ? '测试中...' : '测试'}
          </button>
        </div>
        {testResult && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              testResult.includes('成功')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {testResult}
          </div>
        )}
      </div>

      {/* 最近平台列表 */}
      {providers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">平台列表</h2>
          <div className="space-y-2">
            {providers.slice(0, 5).map((provider) => (
              <Link
                key={provider.id}
                to={`/providers/${provider.id}`}
                className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{provider.name}</div>
                    <div className="text-sm text-gray-500">{provider.id}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {provider.field_count} 个字段
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {providers.length > 5 && (
            <div className="mt-4 text-center">
              <Link
                to="/providers"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                查看全部 {providers.length} 个平台
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
