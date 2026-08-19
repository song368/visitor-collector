// 访客信息收集表单页（首页 /）
import { useState } from 'react';
import { submitVisitor } from '../api';

export default function VisitorForm() {
  // 表单状态：每个字段对应一个输入框的值
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '' });
  const [error, setError] = useState('');       // 校验 / 提交错误信息
  const [success, setSuccess] = useState(false); // 是否提交成功

  // 输入框变化时的统一处理函数
  // 利用 input 的 name 属性，动态更新对应字段（不用写 4 个 onChange）
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 前端校验：返回错误文案，空字符串表示通过
  const validate = () => {
    if (!form.name.trim()) return '姓名不能为空';
    // 手机号：11 位数字，且以 1 开头
    if (!/^1\d{10}$/.test(form.phone)) return '手机号必须是 11 位数字（以 1 开头）';
    // 邮箱选填，但若填写则校验格式
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return '邮箱格式不正确';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止浏览器默认的“提交并刷新页面”行为
    setError('');
    setSuccess(false);

    const msg = validate();
    if (msg) {
      setError(msg); // 校验不通过，直接提示，不发请求
      return;
    }

    try {
      await submitVisitor(form); // 调用后端接口
      setSuccess(true);
      // 提交成功后清空表单
      setForm({ name: '', phone: '', email: '', reason: '' });
    } catch (err) {
      setError(err.message || '提交失败，请稍后重试');
    }
  };

  return (
    <div className="container">
      <h1>访客信息收集表</h1>

      {/* 成功 / 错误提示条 */}
      {success && <div className="alert success">提交成功</div>}
      {error && <div className="alert error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>
          姓名 <span className="required">*</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="请输入姓名"
          />
        </label>

        <label>
          手机号 <span className="required">*</span>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="11 位手机号"
            inputMode="numeric"
          />
        </label>

        <label>
          邮箱（选填）
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
          />
        </label>

        <label>
          来访事由（选填）
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="请简要说明来访事由"
            rows={3}
          />
        </label>

        <button type="submit">提交</button>
      </form>

      <p className="tip">
        管理员可访问 <a href="/admin">/admin</a> 查看所有记录。
      </p>
    </div>
  );
}
