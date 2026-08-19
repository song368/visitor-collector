// 管理后台页（/admin）：管理员登录后，展示所有记录 + 导出 CSV（V2 加了登录鉴权）
import { useState, useEffect } from 'react';
import { getVisitors, adminLogin, getToken, setToken, clearToken } from '../api';

// 当前系统版本号（显示在后台标题，方便确认线上跑的是哪一版）
const APP_VERSION = 'v1.1.0';

// 版本变更记录：把每一次功能升级记在这里，后台可查看
const CHANGELOG = [
  {
    version: 'v1.1.0',
    date: '2026-08-19',
    title: '新增管理后台登录鉴权',
    changes: [
      '后台查看数据需管理员登录，未登录访问接口返回 401',
      '新增登录页面与"退出登录"',
      '登录令牌 7 天有效，关闭标签页即失效',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-08-18',
    title: '访客信息收集系统上线',
    changes: [
      '访客表单：姓名/手机号必填，含格式校验',
      '后台表格展示 + 导出 CSV',
      '前后端分离部署（Vercel 前端 + Render 后端）',
    ],
  },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);     // 是否已登录
  const [checking, setChecking] = useState(true);  // 检查是否有本地令牌
  const [visitors, setVisitors] = useState([]);    // 记录列表
  const [loading, setLoading] = useState(false);   // 是否正在加载数据
  const [error, setError] = useState('');          // 加载错误信息

  // 登录框的状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // 页面首次打开：如果本地已保存过令牌，说明之前登录过，直接加载数据
  useEffect(() => {
    if (getToken()) {
      setAuthed(true);
      loadData();
    }
    setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 拉取所有记录（带令牌请求）
  const loadData = () => {
    setLoading(true);
    setError('');
    getVisitors()
      .then((data) => setVisitors(data))
      .catch((err) => {
        // 令牌失效（401）就回到登录界面
        if (err.message.includes('未登录')) {
          clearToken();
          setAuthed(false);
        }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  // 提交登录
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await adminLogin(username, password);
      setToken(res.token); // 保存令牌
      setAuthed(true);     // 进入后台
      loadData();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  // 退出登录：清掉令牌，回到登录框
  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setVisitors([]);
  };

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
    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visitors.csv';
    a.click();
    URL.revokeObjectURL(url); // 释放临时 URL
  };

  // 检查本地令牌状态还没结束，先显示加载
  if (checking) return <div className="container">加载中…</div>;

  // 未登录：只显示登录界面
  if (!authed) {
    return (
      <div className="container">
        <div className="login-card">
          <h1>管理后台登录 <span className="version-tag">{APP_VERSION}</span></h1>
          <p className="login-tip">登录后才能查看访客数据</p>
          <form onSubmit={handleLogin} className="login-form">
            {loginError && <div className="alert error">{loginError}</div>}
            <label>
              用户名
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </label>
            <label>
              密码
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" disabled={loggingIn}>
              {loggingIn ? '登录中…' : '登录'}
            </button>
          </form>
          <p className="tip">
            <a href="/">← 返回访客表单页</a>
          </p>
        </div>
      </div>
    );
  }

  // 已登录：显示后台表格
  return (
    <div className="container">
      <div className="admin-header">
        <h1>管理后台 <span className="version-tag">{APP_VERSION}</span></h1>
        <div className="admin-actions">
          <button onClick={exportCSV} disabled={visitors.length === 0}>
            导出 CSV
          </button>
          <button onClick={handleLogout} className="btn-note">
            退出登录
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading && <p className="tip">加载中…</p>}

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

      {/* 版本变更记录：每次升级都会记在这里 */}
      <div className="changelog">
        <h2 className="changelog-title">版本记录</h2>
        {CHANGELOG.map((item) => (
          <div key={item.version} className="changelog-item">
            <div className="changelog-head">
              <span className="version-tag">{item.version}</span>
              <span className="changelog-title-text">{item.title}</span>
              <span className="changelog-date">{item.date}</span>
            </div>
            <ul>
              {item.changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="tip">
        <a href="/">← 返回表单页</a>
      </p>
    </div>
  );
}
