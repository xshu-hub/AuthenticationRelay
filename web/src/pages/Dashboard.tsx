import { useState, useEffect } from 'react';
import { providersApi, cacheApi, authApi } from '../api/client';
import type { SSOProviderListItem, CacheStats } from '../types';

export default function Dashboard() {
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
      await loadData(); // 刷新缓存统计
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
      <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">SSO 平台数量</div>
          <div className="text-3xl font-bold text-blue-600">{providers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">字段账号数量</div>
          <div className="text-3xl font-bold text-green-600">{totalFields}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">缓存的 Cookie</div>
          <div className="text-3xl font-bold text-purple-600">
            {cacheStats?.total_entries || 0}
          </div>
        </div>
      </div>

      {/* 认证测试 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">认证测试</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Provider ID</label>
            <input
              type="text"
              value={testProviderId}
              onChange={(e) => setTestProviderId(e.target.value)}
              placeholder="如: sso_a"
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Key</label>
            <input
              type="text"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder="如: test1_user"
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleTestAuth}
            disabled={testing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {testing ? '测试中...' : '测试认证'}
          </button>
        </div>
        {testResult && (
          <div
            className={`mt-4 p-3 rounded ${
              testResult.includes('成功')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {testResult}
          </div>
        )}
      </div>

      {/* 缓存状态 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">缓存状态</h2>
          <button
            onClick={handleClearCache}
            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
          >
            清空缓存
          </button>
        </div>
        {cacheStats && Object.keys(cacheStats.providers).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(cacheStats.providers).map(([providerId, data]) => (
              <div key={providerId} className="border rounded-lg p-4">
                <div className="font-medium text-gray-700 mb-2">
                  {providerId} ({data.count} 个缓存)
                </div>
                <div className="space-y-1">
                  {data.entries.map((entry) => (
                    <div
                      key={entry.key}
                      className="flex justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
                    >
                      <span>{entry.key}</span>
                      <span>验证次数: {entry.validation_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">暂无缓存数据</div>
        )}
      </div>
    </div>
  );
}
