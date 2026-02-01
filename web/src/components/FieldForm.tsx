import { useState } from 'react';
import type { FieldAccountCreate, FieldAccountUpdate } from '../types';

interface FieldFormPropsBase {
  onCancel: () => void;
}

interface FieldFormPropsCreate extends FieldFormPropsBase {
  isEdit?: false;
  initialData?: undefined;
  onSubmit: (data: FieldAccountCreate) => Promise<void>;
}

interface FieldFormPropsEdit extends FieldFormPropsBase {
  isEdit: true;
  initialData: { key: string; username: string };
  onSubmit: (data: FieldAccountUpdate) => Promise<void>;
}

type FieldFormProps = FieldFormPropsCreate | FieldFormPropsEdit;

export default function FieldForm(props: FieldFormProps) {
  const { onCancel, isEdit = false } = props;
  const initialData = props.isEdit ? props.initialData : undefined;
  
  const [formData, setFormData] = useState({
    key: initialData?.key || '',
    username: initialData?.username || '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (props.isEdit) {
        // 编辑模式：只提交修改的字段
        const updateData: FieldAccountUpdate = {};
        if (formData.username !== props.initialData?.username) {
          updateData.username = formData.username;
        }
        if (formData.password) {
          updateData.password = formData.password;
        }
        await props.onSubmit(updateData);
      } else {
        // 创建模式
        await props.onSubmit(formData as FieldAccountCreate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          字段标识 (Key) *
        </label>
        <input
          type="text"
          name="key"
          value={formData.key}
          onChange={handleChange}
          disabled={isEdit}
          required={!isEdit}
          placeholder="如: test1_user"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          用户名 *
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="登录用户名"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          密码 {!isEdit && '*'}
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={!isEdit}
          placeholder={isEdit ? '留空保持不变' : '登录密码'}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isEdit && (
          <p className="mt-1 text-xs text-gray-500">留空则保持原密码不变</p>
        )}
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
          {loading ? '提交中...' : isEdit ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
}
