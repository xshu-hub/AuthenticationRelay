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
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        平台不存在
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <nav className="text-sm text-gray-500">
        <Link to="/providers" className="hover:text-gray-700">
          平台列表
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{provider.name}</span>
      </nav>

      {/* 头部 */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{provider.name}</h1>
            <p className="text-sm text-gray-500 mt-1">ID: {provider.id}</p>
            <p className="text-sm text-gray-400 mt-1">{provider.login_url}</p>
          </div>
          <div className="text-sm text-gray-500">
            {provider.fields.length} 个字段账号
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 认证测试 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">认证测试</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">选择字段</label>
            <select
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="">选择字段...</option>
              {provider.fields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.key} ({f.username})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleTestAuth}
            disabled={testing || !testKey}
            className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {testing ? '测试中...' : '测试认证'}
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

      {/* 字段列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            字段账号 ({provider.fields.length})
          </h2>
          <button
            onClick={() => setShowFieldForm(true)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">添加字段账号</h2>
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
