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
      <div className="text-neutral-400 text-center py-12 border-2 border-dashed border-neutral-100 rounded-xl bg-gray-50/50">
        <p className="mb-2">暂无字段账号</p>
        <p className="text-sm text-neutral-400">点击右上角"添加字段"创建新的账号映射</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div
          key={field.key}
          className="flex justify-between items-center p-4 bg-white border border-neutral-100 rounded-lg hover:shadow-sm transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500 font-bold text-sm">
              {field.key.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-neutral-900 flex items-center gap-2">
                {field.key}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">KEY</span>
              </div>
              <div className="text-sm text-neutral-500 mt-0.5 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {field.username}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingKey(field.key)}
              className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="编辑"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(field.key)}
              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="删除"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* 编辑表单弹窗 */}
      {editingKey && fields.find((f) => f.key === editingKey) && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4 border border-neutral-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900">编辑字段账号</h2>
                <button 
                  onClick={() => setEditingKey(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
