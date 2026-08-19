# 访客信息收集表（前后端分离示例项目）

一个用于**学习网站搭建与部署**的入门级全栈示例：前端收集访客信息，后端存到数据库，并提供一个管理后台查看 / 导出数据。

> 本项目刻意写得简单、注释多，目的是让你看懂“前后端分离 + 环境变量 + 跨域 + 部署”这套最常见的组合。

---

## 一、技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | React 18 + Create React App + react-router-dom | 表单页 + 管理后台页 |
| 后端 | Python Flask + Flask-CORS | 提供 REST API |
| 数据库 | SQLite | 开发/轻量场景够用，单文件零配置 |
| 部署 | Render（后端）+ Vercel（前端） | 两个免费平台，适合练手 |

---

## 二、目录结构

```
visitor-collector/
├── README.md              # 本文件：运行 + 部署说明
├── 学习提示词.md           # 配套学习 prompt 集（可喂给 AI 继续学）
├── frontend/              # 前端（React）
│   ├── package.json       # 依赖与脚本（start / build）
│   ├── .env               # 开发环境变量（REACT_APP_API_URL）
│   ├── .env.example       # 环境变量示例
│   ├── public/
│   │   └── index.html     # HTML 入口
│   └── src/
│       ├── index.js       # React 挂载入口
│       ├── App.js         # 前端路由（/ 和 /admin）
│       ├── api.js         # 统一的后端接口调用封装
│       ├── App.css        # 样式
│       └── components/
│           ├── VisitorForm.js  # 表单页
│           └── AdminPage.js    # 管理后台（表格 + 导出 CSV）
└── backend/               # 后端（Flask）
    ├── app.py             # 主程序 + 两个 API + CORS
    ├── config.py          # 配置（从环境变量读取）
    ├── requirements.txt   # Python 依赖
    ├── .env.example       # 后端环境变量示例
    ├── Procfile           # Render 启动命令
    ├── runtime.txt        # 指定 Python 版本
    └── visitors.db        # 运行时自动生成的 SQLite 文件（首次启动创建）
```

---

## 三、本地运行

### 1. 后端（Flask）

```bash
cd backend

# 创建并激活虚拟环境（强烈建议，避免污染系统 Python）
python -m venv venv
# Windows 激活：
venv\Scripts\activate
# macOS / Linux 激活：
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# （可选）复制环境变量示例。本地默认值已能跑，可跳过
cp .env.example .env

# 启动服务
python app.py
```

后端默认运行在 **http://localhost:5000**
可用 http://localhost:5000/api/health 验证是否启动成功。

### 2. 前端（React）

```bash
cd frontend

# 安装依赖（首次较慢，耐心等）
npm install

# 启动开发服务器
npm start
```

前端默认运行在 **http://localhost:3000**
浏览器打开后：
- `http://localhost:3000/` 是表单页，填完提交
- `http://localhost:3000/admin` 是管理后台，能看到刚才提交的数据，并可导出 CSV

> 前端通过 `frontend/.env` 里的 `REACT_APP_API_URL` 找到后端。默认指向 `http://localhost:5000`，所以本地前后端才能联调。

---

## 四、环境变量说明（重点：不要硬编码）

| 变量 | 用在哪 | 作用 | 示例 |
|------|--------|------|------|
| `REACT_APP_API_URL` | 前端 | 后端 API 根地址 | 本地 `http://localhost:5000`；生产 `https://xxx.onrender.com` |
| `PORT` | 后端 | 服务监听端口 | Render 自动注入；本地默认 `5000` |
| `CORS_ORIGINS` | 后端 | 允许跨域访问的前端域名（逗号分隔） | 本地 `http://localhost:3000`；生产加 `https://xxx.vercel.app` |
| `DB_PATH` | 后端 | SQLite 文件路径（可选） | 默认 `backend/visitors.db` |

**为什么要用环境变量？**
- 同一份代码在“本地”和“线上”通常连不同的地址/域名。
- 把会变的值抽成环境变量，代码就能一份多用，也避免把地址、密钥写死进仓库。
- 前端环境变量必须以 `REACT_APP_` 开头，CRA 才会在构建时把它打进代码。

---

## 五、部署

### 后端 → Render

1. 把整个项目推到 GitHub。
2. 登录 [Render](https://render.com) → **New → Web Service** → 关联你的仓库。
3. 关键设置：
   - **Root Directory**：`backend`（只部署后端子目录）
   - **Build Command**：`pip install -r requirements.txt`
   - **Start Command**：`gunicorn app:app`
4. 在 **Environment** 里添加变量：
   - `CORS_ORIGINS` = `https://你的前端域名.vercel.app`（决定哪些前端能调你）
   - （`PORT` 不用填，Render 自动给）
5. 部署完成后，Render 会给你一个类似 `https://xxx.onrender.com` 的地址。
6. 验证：`https://xxx.onrender.com/api/health` 返回 `{"status":"ok"}` 即成功。

> 注意：Render 的免费版在一段时间无人访问后会“休眠”，首次访问可能慢几秒，属正常现象。

### 前端 → Vercel

1. 登录 [Vercel](https://vercel.com) → **Add New → Project** → 导入同一仓库。
2. 关键设置：
   - **Root Directory**：`frontend`
   - **Build Command**：`npm run build`
   - **Output Directory**：`build`
3. 在 **Settings → Environment Variables** 添加：
   - `REACT_APP_API_URL` = `https://你的后端.onrender.com`（**部署前就要设好**，因为前端在构建时就把地址写进代码了）
4. 保存后 **Redeploy**（重新部署），让环境变量生效。
5. 部署完成得到类似 `https://xxx.vercel.app` 的地址，打开即是表单页。

### 联调要点（最容易踩坑）

- **跨域报错（CORS）**：大概率是后端 `CORS_ORIGINS` 没包含前端域名。改了要重新部署后端。
- **前端提交 404 / 连不上后端**：检查 Vercel 里的 `REACT_APP_API_URL` 是否指向了正确的 Render 域名，且已 Redeploy。
- **前端环境变量改了不生效**：CRA 在 `build` 时固化环境变量，必须重新部署，不是刷新页面就行。

---

## 六、进阶思考（学完这套后可以去了解）

- SQLite 是单文件数据库，适合学习和低并发；真上生产建议换 PostgreSQL（Render 也提供免费 Postgres）。
- 当前任何人都能访问 `/admin` 看数据。真实项目要加**登录鉴权**（如 JWT / Session）。
- 后端校验 + 前端校验：永远不要只信前端，后端必须再校验一次（本项目已示范）。
- 想更进一步可加：分页、搜索、删除单条记录、表单防重复提交等。

---

祝学习顺利 🚀 搭配同目录的 `学习提示词.md` 一起看，遇到不懂的环节直接用里面的 prompt 问 AI。
