import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { providersApi, fieldsApi, cacheApi } from '../../api/client';
import type { SSOProvider, FieldAccountCreate } from '../../types';
import ProviderForm from '../../components/ProviderForm';
import FieldForm from '../../components/FieldForm';
import FieldList from '../../components/FieldList';

export default function AdminProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<SSOProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFieldForm, setShowFieldForm] = useState(false);

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

  const handleUpdate = async (data: Partial<SSOProvider>) => {
    try {
      await providersApi.update(id!, data);
      setShowEditForm(false);
      await loadProvider();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除平台 "${id}" 吗？这将同时删除其下所有字段账号。`)) {
      return;
    }
    try {
      await providersApi.delete(id!);
      navigate('/providers');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
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

  const handleClearProviderCache = async () => {
    if (!confirm('确定要清空该平台的所有缓存吗？')) return;
    try {
      await cacheApi.clearProvider(id!);
      alert('缓存已清空');
    } catch (err) {
      setError(err instanceof Error ? err.message : '清空缓存失败');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-500">加载中...</div>
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
      {/* 头部 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{provider.name}</h1>
          <p className="text-slate-500">ID: {provider.id}</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={handleClearProviderCache}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            清空缓存
          </button>
          <button
            onClick={() => setShowEditForm(true)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            删除
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 平台配置信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">配置信息</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">登录 URL</dt>
            <dd className="text-slate-900 break-all">{provider.login_url}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">用户名选择器</dt>
            <dd className="text-slate-900 font-mono text-sm">{provider.username_selector}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">密码选择器</dt>
            <dd className="text-slate-900 font-mono text-sm">{provider.password_selector}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">提交按钮选择器</dt>
            <dd className="text-slate-900 font-mono text-sm">{provider.submit_selector}</dd>
          </div>
          {provider.success_indicator && (
            <div>
              <dt className="text-sm text-slate-500">
                成功标识 ({provider.success_indicator_type})
              </dt>
              <dd className="text-slate-900">{provider.success_indicator}</dd>
            </div>
          )}
          {provider.validate_url && (
            <div>
              <dt className="text-sm text-slate-500">验证 URL</dt>
              <dd className="text-slate-900 break-all">{provider.validate_url}</dd>
            </div>
          )}
          {provider.invalid_indicator && (
            <div>
              <dt className="text-sm text-slate-500">
                失效标识 ({provider.invalid_indicator_type})
              </dt>
              <dd className="text-slate-900">{provider.invalid_indicator}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-slate-500">登录后等待时间</dt>
            <dd className="text-slate-900">{provider.wait_after_login} ms</dd>
          </div>
        </dl>
      </div>

      {/* 字段列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">字段账号 ({provider.fields.length})</h2>
          <button
            onClick={() => setShowFieldForm(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
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

      {/* 编辑平台表单 */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">编辑 SSO 平台</h2>
              <ProviderForm
                initialData={provider}
                onSubmit={handleUpdate}
                onCancel={() => setShowEditForm(false)}
                isEdit
              />
            </div>
          </div>
        </div>
      )}

      {/* 添加字段表单 */}
      {showFieldForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">添加字段账号</h2>
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
