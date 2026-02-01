import { useState, useEffect } from 'react';
import { providersApi, cacheApi, authApi } from '../../api/client';
import type { SSOProviderListItem, CacheStats } from '../../types';

export default function AdminDashboard() {
  const [providers, setProviders] = useState<SSOProviderListItem[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 测试认证状态
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
      const [providersData, statsData] = await Promise.all([
        providersApi.list(),
        cacheApi.getStats(),
      ]);
      setProviders(providersData);
      setCacheStats(statsData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('确定要清空所有缓存吗？')) return;
    try {
      await cacheApi.clear();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空缓存失败');
    }
  };

  const handleTestAuth = async () => {
    if (!testProviderId || !testKey) {
      setTestResult('请输入 Provider ID 和 Key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await authApi.getCookie({
        provider_id: testProviderId,
        key: testKey,
      });
      setTestResult(`认证成功！获取到 ${Object.keys(result.cookies).length} 个 Cookie`);
      await loadData();
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
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">仪表盘</h1>
        <span className="text-sm text-neutral-500">上次更新: {new Date().toLocaleTimeString()}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-neutral-500">SSO 平台数量</div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{providers.length}</div>
          <div className="mt-2 text-xs text-neutral-400">已接入的认证平台</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-neutral-500">字段账号数量</div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{totalFields}</div>
          <div className="mt-2 text-xs text-neutral-400">所有平台的账号总数</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-neutral-500">缓存的 Cookie</div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">
            {cacheStats?.total_entries || 0}
          </div>
          <div className="mt-2 text-xs text-neutral-400">当前活跃的会话缓存</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 认证测试 */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            认证测试
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Provider ID</label>
                <input
                  type="text"
                  value={testProviderId}
                  onChange={(e) => setTestProviderId(e.target.value)}
                  placeholder="如: sso_a"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Key</label>
                <input
                  type="text"
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  placeholder="如: test1_user"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleTestAuth}
              disabled={testing}
              className="w-full px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {testing ? '测试中...' : '测试认证'}
            </button>
            
            {testResult && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm border ${
                  testResult.includes('成功')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}
              >
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* 缓存状态 */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              缓存状态
            </h2>
            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              清空缓存
            </button>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {cacheStats && Object.keys(cacheStats.providers).length > 0 ? (
              Object.entries(cacheStats.providers).map(([providerId, data]) => (
                <div key={providerId} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-neutral-700 text-sm">{providerId}</span>
                    <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-neutral-500 shadow-sm">
                      {data.count} 个缓存
                    </span>
                  </div>
                  <div className="space-y-2">
                    {data.entries.map((entry) => (
                      <div
                        key={entry.key}
                        className="flex justify-between items-center text-xs text-neutral-600 bg-white px-3 py-2 rounded border border-gray-100"
                      >
                        <span className="font-mono">{entry.key}</span>
                        <span className="text-neutral-400">验证: {entry.validation_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-neutral-400 text-center py-12 flex flex-col items-center">
                <svg className="w-12 h-12 mb-3 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                暂无缓存数据
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
