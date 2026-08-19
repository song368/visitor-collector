# 后端主程序（Flask）
# 提供两个接口：
#   POST /api/visitors  -> 新增一条访客记录（写入 SQLite）
#   GET  /api/visitors  -> 返回所有记录（JSON）
# 并开启 CORS 允许前端跨域请求。

import os
import sqlite3
import datetime
import functools

import jwt
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

from config import Config

# 加载同目录下的 .env 文件（本地开发用；在 Render 等平台由平台注入环境变量）
load_dotenv()

app = Flask(__name__)

# 开启跨域：只允许配置里列出的前端域名访问，避免任意网站都能调你的接口
CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)


# ---------- 数据库辅助函数 ----------
def get_db():
    """获取当前请求的数据库连接（同一个请求内复用，避免重复连接）。"""
    db = getattr(g, '_db', None)
    if db is None:
        db = g._db = sqlite3.connect(Config.DB_PATH)
        # row_factory 让查询结果可以用字段名访问（dict 风格）
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_db(exc):
    """请求结束时自动关闭数据库连接。"""
    db = getattr(g, '_db', None)
    if db is not None:
        db.close()


def init_db():
    """初始化数据库表结构（表不存在才创建）。"""
    with app.app_context():
        db = get_db()
        db.execute(
            '''
            CREATE TABLE IF NOT EXISTS visitors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            '''
        )
        db.commit()


# ---------- 接口 ----------
@app.route('/api/health', methods=['GET'])
def health():
    """健康检查接口：部署平台（如 Render）用它来判断服务是否存活。"""
    return jsonify({'status': 'ok'})


# ---------- 管理员登录与鉴权（V2 安全增强）----------
def _issue_token():
    """签发一个带过期时间的登录令牌(JWT)。"""
    payload = {
        'sub': 'admin',                                     # 主题：管理员
        'exp': datetime.datetime.now(datetime.timezone.utc)
               + datetime.timedelta(hours=Config.TOKEN_EXPIRE_HOURS),  # 过期时间
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')


def require_auth(view):
    """装饰器：给需要登录才能访问的接口加锁。没带有效令牌就返回 401。"""
    @functools.wraps(view)
    def wrapped(*args, **kwargs):
        # 从请求头拿令牌：格式 "Authorization: Bearer <token>"
        auth = request.headers.get('Authorization', '')
        token = auth.split(' ')[-1] if auth.startswith('Bearer ') else ''
        try:
            jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        except Exception:
            # 缺令牌 / 令牌错误 / 已过期，一律拒绝
            return jsonify({'message': '未登录或登录已过期'}), 401
        return view(*args, **kwargs)
    return wrapped


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """管理后台登录：用户名+密码正确则签发令牌，前端保存后用于访问受保护接口。"""
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    # 用配置的管理员账号密码比对（生产环境应从环境变量注入）
    if username != Config.ADMIN_USERNAME or password != Config.ADMIN_PASSWORD:
        return jsonify({'message': '用户名或密码错误'}), 401

    return jsonify({
        'message': 'ok',
        'token': _issue_token(),
        'expires_hours': Config.TOKEN_EXPIRE_HOURS,
    }), 200


@app.route('/api/visitors', methods=['POST'])
def add_visitor():
    """新增访客记录。"""
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    email = (data.get('email') or '').strip()
    reason = (data.get('reason') or '').strip()

    # 后端校验（前端也校验，这里是“第二道防线”，防止有人绕过前端直接调接口）
    if not name:
        return jsonify({'message': '姓名必填'}), 400
    if not phone.isdigit() or len(phone) != 11:
        return jsonify({'message': '手机号必须是 11 位数字'}), 400
    if email and '@' not in email:
        return jsonify({'message': '邮箱格式不正确'}), 400

    db = get_db()
    db.execute(
        'INSERT INTO visitors (name, phone, email, reason) VALUES (?, ?, ?, ?)',
        (name, phone, email, reason),
    )
    db.commit()
    return jsonify({'message': 'ok'}), 201


@app.route('/api/visitors', methods=['GET'])
@require_auth  # V2：查询所有记录必须管理员登录，防止陌生人看数据
def list_visitors():
    """返回所有访客记录（按 id 倒序，最新的在前）。"""
    db = get_db()
    rows = db.execute(
        'SELECT id, name, phone, email, reason, created_at '
        'FROM visitors ORDER BY id DESC'
    ).fetchall()
    # 把每一行转成字典列表，方便 jsonify 序列化成 JSON
    result = [dict(row) for row in rows]
    return jsonify(result)


# 模块加载时即建表（关键：Render 用 gunicorn app:app 启动，不会走下面的 if __name__ 分支，
# 必须在这里建表，否则数据库表不存在，访问接口会报 500）
init_db()

if __name__ == '__main__':
    # 端口从环境变量读取：Render 会注入 PORT；本地默认 5000
    port = int(os.getenv('PORT', 5000))
    # host=0.0.0.0 让容器/云平台上外部能访问；debug=True 仅本地开发方便
    app.run(host='0.0.0.0', port=port, debug=True)
