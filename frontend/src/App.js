// 路由配置：根据 URL 决定渲染哪个页面
import { Routes, Route } from 'react-router-dom';
import VisitorForm from './components/VisitorForm';
import AdminPage from './components/AdminPage';

// Routes 类似一个“路由表”
// path="/"      -> 访客信息收集表单页
// path="/admin" -> 管理后台（表格 + 导出 CSV）
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<VisitorForm />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
