import { useState } from 'react';
import type { FieldAccount, FieldAccountUpdate } from '../types';
import { fieldsApi } from '../api/client';
import FieldForm from './FieldForm';

interface FieldListProps {
  fields: FieldAccount[];
  providerId: string;
  onDelete: (key: string) => void;
  onUpdate: () => void;
}

export default function FieldList({
  fields,
  providerId,
  onDelete,
  onUpdate,
}: FieldListProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const handleUpdate = async (data: FieldAccountUpdate) => {
    try {
      await fieldsApi.update(providerId, editingKey!, data);
      setEditingKey(null);
      onUpdate();
    } catch (err) {
      throw err;
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        暂无字段账号，点击"添加字段"创建
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fields.map((field) => (
        <div
          key={field.key}
          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
        >
          <div>
            <div className="font-medium text-gray-900">{field.key}</div>
            <div className="text-sm text-gray-500">用户名: {field.username}</div>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setEditingKey(field.key)}
              className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
            >
              编辑
            </button>
            <button
              onClick={() => onDelete(field.key)}
              className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
            >
              删除
            </button>
          </div>
        </div>
      ))}

      {/* 编辑表单弹窗 */}
      {editingKey && fields.find((f) => f.key === editingKey) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">编辑字段账号</h2>
              <FieldForm
                initialData={fields.find((f) => f.key === editingKey)!}
                onSubmit={handleUpdate}
                onCancel={() => setEditingKey(null)}
                isEdit
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
