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
    <div className="space-y-8">
      {/* 头部 */}
      <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{provider.name}</h1>
          <div className="flex items-center mt-2 text-sm text-neutral-500 font-mono">
            <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 mr-2">ID</span>
            {provider.id}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClearProviderCache}
            className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 text-sm font-medium transition-colors shadow-sm"
          >
            清空缓存
          </button>
          <button
            onClick={() => setShowEditForm(true)}
            className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 text-sm font-medium transition-colors shadow-sm"
          >
            编辑配置
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
          >
            删除平台
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 平台配置信息 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          配置详情
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="col-span-2">
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">登录 URL</dt>
            <dd className="text-sm text-neutral-900 font-mono bg-gray-50 p-2 rounded border border-gray-100 break-all">{provider.login_url}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">用户名选择器</dt>
            <dd className="text-sm text-neutral-900 font-mono bg-gray-50 p-2 rounded border border-gray-100">{provider.username_selector}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">密码选择器</dt>
            <dd className="text-sm text-neutral-900 font-mono bg-gray-50 p-2 rounded border border-gray-100">{provider.password_selector}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">提交按钮选择器</dt>
            <dd className="text-sm text-neutral-900 font-mono bg-gray-50 p-2 rounded border border-gray-100">{provider.submit_selector}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">登录后等待时间</dt>
            <dd className="text-sm text-neutral-900 font-medium flex items-center">
              {provider.wait_after_login} 
              <span className="text-neutral-400 ml-1 text-xs">ms</span>
            </dd>
          </div>
          {provider.success_indicator && (
            <div>
              <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                成功标识 <span className="text-neutral-400 normal-case">({provider.success_indicator_type})</span>
              </dt>
              <dd className="text-sm text-neutral-900 font-mono bg-gray-50 p-2 rounded border border-gray-100">{provider.success_indicator}</dd>
            </div>
          )}
          {provider.invalid_indicator && (
            <div>
              <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                失效标识 <span className="text-neutral-400 normal-case">({provider.invalid_indicator_type})</span>
              </dt>
              <dd className="text-sm text-neutral-900 font-mono bg-gray-50 p-2 rounded border border-gray-100">{provider.invalid_indicator}</dd>
            </div>
          )}
          {provider.validate_url && (
            <div className="col-span-2">
              <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">验证 URL</dt>
              <dd className="text-sm text-neutral-900 font-mono bg-gray-50 p-2 rounded border border-gray-100 break-all">{provider.validate_url}</dd>
            </div>
          )}
        </dl>
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

      {/* 编辑平台表单 */}
      {showEditForm && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 border border-neutral-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900">编辑 SSO 平台</h2>
                <button 
                  onClick={() => setShowEditForm(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
