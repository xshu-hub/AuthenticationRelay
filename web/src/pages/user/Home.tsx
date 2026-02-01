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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  const totalFields = providers.reduce((sum, p) => sum + p.field_count, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">首页</h1>
        <span className="text-sm text-neutral-500">欢迎回来，用户</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 快速统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-neutral-500">可用平台</div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-neutral-900">{providers.length}</div>
            <Link
              to="/providers"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              查看全部 →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-neutral-500">字段账号总数</div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{totalFields}</div>
        </div>
      </div>

      {/* 认证测试 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          快速认证测试
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          输入平台 ID 和字段 Key，测试获取认证 Cookie
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">平台 ID</label>
            <div className="relative">
              <select
                value={testProviderId}
                onChange={(e) => setTestProviderId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all appearance-none pr-8"
              >
                <option value="">选择平台...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">字段 Key</label>
            <input
              type="text"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder="如: test1_user"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={handleTestAuth}
            disabled={testing}
            className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm h-[38px]"
          >
            {testing ? '测试中...' : '测试认证'}
          </button>
        </div>
        {testResult && (
          <div
            className={`mt-6 p-4 rounded-lg text-sm border ${
              testResult.includes('成功')
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            {testResult}
          </div>
        )}
      </div>

      {/* 最近平台列表 */}
      {providers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">最近平台</h2>
            <Link
              to="/providers"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {providers.slice(0, 5).map((provider) => (
              <Link
                key={provider.id}
                to={`/providers/${provider.id}`}
                className="block p-4 rounded-lg border border-neutral-100 hover:bg-gray-50 hover:border-neutral-200 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500 font-bold text-sm group-hover:bg-white group-hover:shadow-sm transition-all">
                      {provider.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">{provider.name}</div>
                      <div className="text-sm text-neutral-500 font-mono">{provider.id}</div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                    {provider.field_count} 个字段
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
