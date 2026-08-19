# 后端配置：所有“会随环境变化”的值都从环境变量读取，不写死
import os

class Config:
    # SQLite 数据库文件路径
    # 默认放在 backend 目录下（visitors.db）；部署时可改成绝对路径或挂载卷
    DB_PATH = os.getenv(
        'DB_PATH',
        os.path.join(os.path.dirname(__file__), 'visitors.db')
    )

    # 允许跨域访问的前端域名（CORS）
    # 多个域名用逗号分隔；生产环境务必改成你的 Vercel 域名
    # 例如：http://localhost:3000,https://your-frontend.vercel.app
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000'
    ).split(',')
