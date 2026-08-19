// 管理后台页（/admin）：表格展示所有记录 + 导出 CSV
import { useState, useEffect } from 'react';
import { getVisitors } from '../api';

export default function AdminPage() {
  const [visitors, setVisitors] = useState([]); // 记录列表
  const [loading, setLoading] = useState(true); // 是否正在加载
  const [error, setError] = useState('');       // 错误信息

  // useEffect 在组件首次渲染后执行：拉取所有记录
  useEffect(() => {
    getVisitors()
      .then((data) => setVisitors(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []); // 空依赖数组 => 只在挂载时执行一次

  // 将记录导出为 CSV 文件（纯前端生成，无需后端额外接口）
  const exportCSV = () => {
    const headers = ['ID', '姓名', '手机号', '邮箱', '事由', '提交时间'];
    // 每个单元格用双引号包裹，并把内容里的 " 转义成 ""，避免 CSV 错位
    const escape = (cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
    const lines = [
      headers.join(','),
      ...visitors.map((v) =>
        [v.id, v.name, v.phone, v.email, v.reason, v.created_at].map(escape).join(',')
      ),
    ];
    // 开头加 BOM(\uFEFF)，让 Excel 正确识别 UTF-8 中文，不乱码
    const csv = '﻿' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visitors.csv';
    a.click();
    URL.revokeObjectURL(url); // 释放临时 URL
  };

  if (loading) return <div className="container">加载中…</div>;

  return (
    <div className="container">
      <div className="admin-header">
        <h1>管理后台</h1>
        <button onClick={exportCSV} disabled={visitors.length === 0}>
          导出 CSV
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>手机号</th>
            <th>邮箱</th>
            <th>事由</th>
            <th>提交时间</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.name}</td>
              <td>{v.phone}</td>
              <td>{v.email || '-'}</td>
              <td>{v.reason || '-'}</td>
              <td>{v.created_at}</td>
            </tr>
          ))}
          {visitors.length === 0 && (
            <tr>
              <td colSpan="6" className="empty">暂无记录</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="tip">
        <a href="/">← 返回表单页</a>
      </p>
    </div>
  );
}
