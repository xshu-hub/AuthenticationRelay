import { useState } from 'react';
import type { SSOProviderCreate, SSOProvider } from '../types';

interface ProviderFormProps {
  initialData?: Partial<SSOProvider>;
  onSubmit: (data: SSOProviderCreate) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function ProviderForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}: ProviderFormProps) {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    login_url: initialData?.login_url || '',
    username_selector: initialData?.username_selector || '',
    password_selector: initialData?.password_selector || '',
    submit_selector: initialData?.submit_selector || '',
    success_indicator: initialData?.success_indicator || '',
    success_indicator_type: initialData?.success_indicator_type || 'url_contains',
    validate_url: initialData?.validate_url || '',
    invalid_indicator: initialData?.invalid_indicator || '',
    invalid_indicator_type: initialData?.invalid_indicator_type || 'url_contains',
    wait_after_login: initialData?.wait_after_login || 2000,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData as SSOProviderCreate);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const inputClass = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500";
  const labelClass = "block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>
            平台 ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            disabled={isEdit}
            required
            placeholder="如: sso_a"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            平台名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="如: 公司 SSO"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          登录页面 URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          name="login_url"
          value={formData.login_url}
          onChange={handleChange}
          required
          placeholder="https://sso.example.com/login"
          className={inputClass}
        />
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          表单选择器配置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>
              用户名输入框 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username_selector"
              value={formData.username_selector}
              onChange={handleChange}
              required
              placeholder="#username"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>
              密码输入框 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="password_selector"
              value={formData.password_selector}
              onChange={handleChange}
              required
              placeholder="#password"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>
              登录按钮 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="submit_selector"
              value={formData.submit_selector}
              onChange={handleChange}
              required
              placeholder="#login-btn"
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          登录成功判断
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>成功标识</label>
            <input
              type="text"
              name="success_indicator"
              value={formData.success_indicator}
              onChange={handleChange}
              placeholder="/dashboard"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>标识类型</label>
            <div className="relative">
              <select
                name="success_indicator_type"
                value={formData.success_indicator_type}
                onChange={handleChange}
                className={`${inputClass} appearance-none pr-8`}
              >
                <option value="url_contains">URL 包含</option>
                <option value="url_equals">URL 等于</option>
                <option value="element_exists">元素存在</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Cookie 验证配置
        </h3>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>验证 URL</label>
            <input
              type="url"
              name="validate_url"
              value={formData.validate_url}
              onChange={handleChange}
              placeholder="https://app.example.com/api/user"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>失效标识</label>
              <input
                type="text"
                name="invalid_indicator"
                value={formData.invalid_indicator}
                onChange={handleChange}
                placeholder="/login"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>标识类型</label>
              <div className="relative">
                <select
                  name="invalid_indicator_type"
                  value={formData.invalid_indicator_type}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none pr-8`}
                >
                  <option value="url_contains">URL 包含</option>
                  <option value="status_code">状态码</option>
                  <option value="element_exists">元素存在</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <div className="w-48">
          <label className={labelClass}>
            登录后等待时间 (ms)
          </label>
          <input
            type="number"
            name="wait_after_login"
            value={formData.wait_after_login}
            onChange={handleChange}
            min="0"
            step="100"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
        >
          {loading ? '提交中...' : isEdit ? '保存更改' : '创建平台'}
        </button>
      </div>
    </form>
  );
}
