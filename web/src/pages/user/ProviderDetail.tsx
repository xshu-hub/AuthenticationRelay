import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { providersApi, fieldsApi, authApi } from '../../api/client';
import type { SSOProvider, FieldAccountCreate } from '../../types';
import FieldForm from '../../components/FieldForm';
import FieldList from '../../components/FieldList';

export default function UserProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<SSOProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFieldForm, setShowFieldForm] = useState(false);

  // 认证测试状态
  const [testKey, setTestKey] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProvider();
    }
  }, [id]);

  const loadProvider = async () => {
    try {
      setLoading(true);
      const data = await providersApi.get(id!);
      setProvider(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = async (data: FieldAccountCreate) => {
    try {
      await fieldsApi.create(id!, data);
      setShowFieldForm(false);
      await loadProvider();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteField = async (key: string) => {
    if (!confirm(`确定要删除字段 "${key}" 吗？`)) {
      return;
    }
    try {
      await fieldsApi.delete(id!, key);
      await loadProvider();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleTestAuth = async () => {
    if (!testKey) {
      setTestResult('请选择要测试的字段');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await authApi.getCookie({
        provider_id: id!,
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

  if (!provider) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        平台不存在
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center text-sm text-neutral-500">
        <Link to="/providers" className="hover:text-neutral-900 transition-colors">
          平台列表
        </Link>
        <svg className="w-4 h-4 mx-2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-neutral-900 font-medium">{provider.name}</span>
      </nav>

      {/* 头部 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {provider.name.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{provider.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-neutral-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{provider.id}</span>
                <span className="text-sm text-neutral-400 truncate max-w-md">{provider.login_url}</span>
              </div>
            </div>
          </div>
          <div className="text-sm font-medium text-neutral-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            {provider.fields.length} 个字段账号
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 认证测试 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          认证测试
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">选择字段</label>
            <div className="relative">
              <select
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all appearance-none pr-8"
              >
                <option value="">选择字段...</option>
                {provider.fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.key} ({f.username})
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
          <button
            onClick={handleTestAuth}
            disabled={testing || !testKey}
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

      {/* 字段列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            字段账号 <span className="text-neutral-400 font-normal ml-2 text-sm">({provider.fields.length})</span>
          </h2>
          <button
            onClick={() => setShowFieldForm(true)}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-sm font-medium transition-colors shadow-sm"
          >
            添加字段
          </button>
        </div>
        <FieldList
          fields={provider.fields}
          providerId={id!}
          onDelete={handleDeleteField}
          onUpdate={loadProvider}
        />
      </div>

      {/* 添加字段表单 */}
      {showFieldForm && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4 border border-neutral-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900">添加字段账号</h2>
                <button 
                  onClick={() => setShowFieldForm(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FieldForm
                onSubmit={handleCreateField}
                onCancel={() => setShowFieldForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
