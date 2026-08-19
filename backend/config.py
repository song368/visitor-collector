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

    # ---- 管理后台登录（V2 安全增强）----
    # 管理员用户名 / 密码：生产环境务必在平台上设置环境变量覆盖默认值，别用默认值上线
    ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

    # 签发登录令牌(JWT) 用的密钥：务必改成一个足够长的随机字符串
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-me-in-prod')

    # 登录令牌有效期（小时），默认 7 天；到期后需重新登录
    TOKEN_EXPIRE_HOURS = int(os.getenv('TOKEN_EXPIRE_HOURS', 24 * 7))
