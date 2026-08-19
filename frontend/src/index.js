// 应用入口文件
// 作用：把 React 组件树挂载到 public/index.html 里的 <div id="root">
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './App.css';

// BrowserRouter 提供“前端路由”能力：
// 让 / 和 /admin 在不刷新页面的前提下显示不同内容
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
