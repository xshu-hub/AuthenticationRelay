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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            平台 ID *
          </label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            disabled={isEdit}
            required
            placeholder="如: sso_a"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            平台名称 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="如: 公司 SSO"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          登录页面 URL *
        </label>
        <input
          type="url"
          name="login_url"
          value={formData.login_url}
          onChange={handleChange}
          required
          placeholder="https://sso.example.com/login"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">表单选择器</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              用户名输入框 *
            </label>
            <input
              type="text"
              name="username_selector"
              value={formData.username_selector}
              onChange={handleChange}
              required
              placeholder="#username"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              密码输入框 *
            </label>
            <input
              type="text"
              name="password_selector"
              value={formData.password_selector}
              onChange={handleChange}
              required
              placeholder="#password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              登录按钮 *
            </label>
            <input
              type="text"
              name="submit_selector"
              value={formData.submit_selector}
              onChange={handleChange}
              required
              placeholder="#login-btn"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">登录成功判断</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">成功标识</label>
            <input
              type="text"
              name="success_indicator"
              value={formData.success_indicator}
              onChange={handleChange}
              placeholder="/dashboard"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">标识类型</label>
            <select
              name="success_indicator_type"
              value={formData.success_indicator_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="url_contains">URL 包含</option>
              <option value="url_equals">URL 等于</option>
              <option value="element_exists">元素存在</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Cookie 验证配置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">验证 URL</label>
            <input
              type="url"
              name="validate_url"
              value={formData.validate_url}
              onChange={handleChange}
              placeholder="https://app.example.com/api/user"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">失效标识</label>
              <input
                type="text"
                name="invalid_indicator"
                value={formData.invalid_indicator}
                onChange={handleChange}
                placeholder="/login"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">标识类型</label>
              <select
                name="invalid_indicator_type"
                value={formData.invalid_indicator_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="url_contains">URL 包含</option>
                <option value="status_code">状态码</option>
                <option value="element_exists">元素存在</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="w-48">
          <label className="block text-sm text-gray-600 mb-1">
            登录后等待时间 (ms)
          </label>
          <input
            type="number"
            name="wait_after_login"
            value={formData.wait_after_login}
            onChange={handleChange}
            min="0"
            step="100"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '提交中...' : isEdit ? '保存' : '创建'}
        </button>
      </div>
    </form>
  );
}
