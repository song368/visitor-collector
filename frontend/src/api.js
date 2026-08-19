// 统一的后端接口调用封装
// 关键点：API 地址来自环境变量 REACT_APP_API_URL，绝不写死在代码里
// （Create React App 会把 .env 里的 REACT_APP_* 注入到 process.env）
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ---- 登录令牌管理（V2 安全增强）----
// 登录成功后后端会返回一个 token，把它存到 sessionStorage（关掉标签页就失效，
// 比 localStorage 更安全）。之后查询接口都要带上这个 token。
const TOKEN_KEY = 'admin_token';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// 管理员登录（对应后端 POST /api/admin/login）
export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || '登录失败');
  return data; // { token, expires_hours }
}

// 提交一条访客记录（对应后端 POST /api/visitors；访客提交，不需要登录）
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

// 获取所有访客记录（对应后端 GET /api/visitors；需要管理员登录，带 token）
export async function getVisitors() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/visitors`, {
    // 把令牌放进 Authorization 请求头，后端校验通过才放行
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) throw new Error('未登录或登录已过期，请重新登录');
  if (!res.ok) throw new Error('获取记录失败');
  return res.json(); // 返回数组
}
