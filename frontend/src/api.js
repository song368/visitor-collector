// 统一的后端接口调用封装
// 关键点：API 地址来自环境变量 REACT_APP_API_URL，绝不写死在代码里
// （Create React App 会把 .env 里的 REACT_APP_* 注入到 process.env）
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 提交一条访客记录（对应后端 POST /api/visitors）
export async function submitVisitor(data) {
  const res = await fetch(`${API_BASE}/api/visitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    // 后端返回 4xx/5xx 时，把错误信息抛给调用方
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '提交失败');
  }
  return res.json();
}

// 获取所有访客记录（对应后端 GET /api/visitors）
export async function getVisitors() {
  const res = await fetch(`${API_BASE}/api/visitors`);
  if (!res.ok) throw new Error('获取记录失败');
  return res.json(); // 返回数组
}
