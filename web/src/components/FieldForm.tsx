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

  const inputClass = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500";
  const labelClass = "block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>
          字段标识 (Key) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="key"
          value={formData.key}
          onChange={handleChange}
          disabled={isEdit}
          required={!isEdit}
          placeholder="如: test1_user"
          className={inputClass}
        />
        {!isEdit && (
          <p className="mt-1.5 text-xs text-neutral-400">
            唯一标识，创建后不可修改
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          用户名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="登录用户名"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          密码 {!isEdit && <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required={!isEdit}
          placeholder={isEdit ? '留空保持不变' : '登录密码'}
          className={inputClass}
        />
        {isEdit && (
          <p className="mt-1.5 text-xs text-neutral-400">
            留空则保持原密码不变
          </p>
        )}
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
          {loading ? '提交中...' : isEdit ? '保存更改' : '添加字段'}
        </button>
      </div>
    </form>
  );
}
