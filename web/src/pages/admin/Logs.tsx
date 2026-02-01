import { useState, useEffect, useCallback } from 'react';
import { logsApi } from '../../api/client';
import type { AuditLog, AuditLogStats, LogQueryParams } from '../../types';

// 操作类型的友好显示名称
const ACTION_LABELS: Record<string, string> = {
  'provider.create': '创建平台',
  'provider.update': '更新平台',
  'provider.delete': '删除平台',
  'provider.view': '查看平台',
  'provider.list': '列出平台',
  'field.create': '创建字段',
  'field.update': '更新字段',
  'field.delete': '删除字段',
  'field.view': '查看字段',
  'field.list': '列出字段',
  'auth.request': '认证请求',
  'auth.success': '认证成功',
  'auth.failure': '认证失败',
  'auth.cache_hit': '缓存命中',
  'auth.cache_miss': '缓存未命中',
  'cache.clear': '清空缓存',
  'cache.clear_provider': '清空平台缓存',
  'cache.clear_field': '清空字段缓存',
  'cache.stats': '查看缓存统计',
  'system.login': '系统登录',
  'system.logout': '系统登出',
};

// 资源类型的友好显示名称
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  provider: 'SSO 平台',
  field: '字段账号',
  auth: '认证',
  cache: '缓存',
  system: '系统',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  
  // 筛选和分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState<string>('');
  
  // 展开的日志详情
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // 加载日志
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: LogQueryParams = {
        page,
        page_size: pageSize,
      };
      
      if (actionFilter) params.action = actionFilter;
      if (resourceTypeFilter) params.resource_type = resourceTypeFilter;
      if (successFilter !== '') params.success = successFilter === 'true';
      
      const [logsData, statsData] = await Promise.all([
        logsApi.list(params),
        logsApi.getStats(),
      ]);
      
      setLogs(logsData.items);
      setTotal(logsData.total);
      setStats(statsData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, resourceTypeFilter, successFilter]);
  
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);
  
  // 重置筛选
  const resetFilters = () => {
    setActionFilter('');
    setResourceTypeFilter('');
    setSuccessFilter('');
    setPage(1);
  };
  
  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  // 获取操作类型的显示标签
  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action;
  };
  
  // 获取资源类型的显示标签
  const getResourceTypeLabel = (type: string) => {
    return RESOURCE_TYPE_LABELS[type] || type;
  };
  
  // 获取操作类型的颜色样式
  const getActionStyle = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-700';
    if (action.includes('delete')) return 'bg-red-100 text-red-700';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700';
    if (action.includes('success')) return 'bg-emerald-100 text-emerald-700';
    if (action.includes('failure')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };
  
  // 分页组件
  const totalPages = Math.ceil(total / pageSize);
  
  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">操作日志</h1>
        <button
          onClick={loadLogs}
          className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          刷新
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
            <div className="text-sm text-neutral-500 mb-1">总日志数</div>
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
            <div className="text-sm text-neutral-500 mb-1">成功操作</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.success_count}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
            <div className="text-sm text-neutral-500 mb-1">失败操作</div>
            <div className="text-2xl font-bold text-red-600">{stats.failure_count}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
            <div className="text-sm text-neutral-500 mb-1">成功率</div>
            <div className="text-2xl font-bold text-neutral-900">
              {stats.total > 0 ? ((stats.success_count / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      )}
      
      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
              操作类型
            </label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
            >
              <option value="">全部</option>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
              资源类型
            </label>
            <select
              value={resourceTypeFilter}
              onChange={(e) => { setResourceTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
            >
              <option value="">全部</option>
              {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
              状态
            </label>
            <select
              value={successFilter}
              onChange={(e) => { setSuccessFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
            >
              <option value="">全部</option>
              <option value="true">成功</option>
              <option value="false">失败</option>
            </select>
          </div>
          
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            重置
          </button>
        </div>
      </div>
      
      {/* 日志列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  操作
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  资源
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <>
                  <tr 
                    key={log.id}
                    className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getActionStyle(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-neutral-500">{getResourceTypeLabel(log.resource_type)}</span>
                      {log.resource_id && (
                        <span className="ml-1 text-neutral-900 font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded">
                          {log.resource_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.user_role && (
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                          log.user_role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.user_role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500 font-mono text-xs">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="inline-flex items-center text-emerald-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-neutral-400 hover:text-neutral-600">
                        <svg 
                          className={`w-4 h-4 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && log.details && (
                    <tr key={`${log.id}-details`}>
                      <td colSpan={7} className="px-4 py-3 bg-neutral-50">
                        <div className="text-xs font-medium text-neutral-500 mb-2">详情</div>
                        <pre className="text-sm text-neutral-700 bg-white p-3 rounded border border-neutral-200 overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    暂无日志数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
            <div className="text-sm text-neutral-500">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
