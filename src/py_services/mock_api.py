import json
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from mock_data import mock_data
import redis

api = Blueprint('api', __name__)

# 初始化 Redis 客户端（假设 Redis 运行在 localhost:6379）
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# 请求日志中间件：记录每次请求的信息
@api.before_request
def log_request():
    current_app.logger.info(f"[Mock API Request] {request.method} {request.path}")

def generate_token(username):
    """生成一个模拟的 JWT token（仅用于示例，不具备安全性）"""
    return f"mock-jwt-{username}-{int(time.time() * 1000)}"

# 登录接口
@api.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    user = next((u for u in mock_data['users'] if u['username'] == username and u['password'] == password), None)
    if user:
        return jsonify({
            "token": generate_token(username),
            "token_type": "bearer"
        })
    return jsonify({"detail": "Incorrect username or password"}), 401

# 获取新闻列表接口（可根据分类筛选）
@api.route('/api/news', methods=['GET'])
def get_news():
    category = request.args.get('category')
    try:
        news_list = list(mock_data['news'])
        if category:
            news_list = [item for item in news_list if item.get('category') == category]
        current_app.logger.info(
            f"[Mock API Response] 返回 {'分类: ' + category if category else '所有'} 新闻: {news_list}"
        )
        return jsonify(news_list)
    except Exception as e:
        current_app.logger.error(f"[Mock API Error]: {str(e)}")
        return jsonify([])

# 根据新闻 ID 获取单条新闻数据
@api.route('/api/news/<int:news_id>', methods=['GET'])
def get_news_by_id(news_id):
    news_item = next((item for item in mock_data['news'] if item['id'] == news_id), None)
    if news_item is None:
        return jsonify({"detail": "News not found"}), 404
    return jsonify(news_item)

# 获取分类信息
@api.route('/api/categories/<category_id>', methods=['GET'])
def get_category(category_id):
    try:
        category = mock_data['categories'].get(category_id)
        if category is None:
            current_app.logger.info(f"[Mock API] 分类不存在: {category_id}")
            return jsonify({"error": "分类不存在"}), 404
        current_app.logger.info(f"[Mock API] 返回分类信息: {category}")
        return jsonify(category)
    except Exception as e:
        current_app.logger.error(f"[Mock API Error]: {str(e)}")
        return jsonify({"error": "服务器错误"}), 500

# 后台接口：获取所有新闻
@api.route('/api/admin/news', methods=['GET'])
def admin_get_news():
    return jsonify(mock_data['news'])

# 后台接口：创建新闻
@api.route('/api/admin/news', methods=['POST'])
def create_news():
    data = request.get_json() or {}
    next_id = max((item['id'] for item in mock_data['news']), default=0) + 1
    category = data.get('category')
    category_name = mock_data['categories'].get(category, {}).get('name', category)
    new_news = {
        "id": next_id,
        "title": data.get('title'),
        "summary": data.get('summary'),
        "content": data.get('content'),
        "category": category,
        "category_name": category_name,
        "image": None,  # 实际应用中可处理文件上传
        "published_at": datetime.utcnow().isoformat() + "Z",
        "author": "新闻编辑",
        "author_id": "千手防务",
        "tags": [tag.strip() for tag in data.get('tags', '').split(',')] if data.get('tags') else []
    }
    mock_data['news'].append(new_news)
    if category in mock_data['categories']:
        mock_data['categories'][category]['news_count'] += 1
    return jsonify({"success": True, "id": new_news['id']}), 201

# 后台接口：更新新闻
@api.route('/api/admin/news/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    data = request.get_json() or {}
    news_index = next((i for i, item in enumerate(mock_data['news']) if item['id'] == news_id), None)
    if news_index is None:
        return jsonify({"detail": "News not found"}), 404

    old_category = mock_data['news'][news_index]['category']
    new_category = data.get('category')
    # 更新新闻数据
    mock_data['news'][news_index].update({
        "title": data.get('title'),
        "summary": data.get('summary'),
        "content": data.get('content'),
        "category": new_category,
        "category_name": mock_data['categories'].get(new_category, {}).get('name', new_category)
    })
    if data.get('tags'):
        mock_data['news'][news_index]['tags'] = [tag.strip() for tag in data.get('tags', '').split(',')]
    # 如果分类发生变化，则更新各分类下的新闻计数
    if old_category != new_category:
        if old_category in mock_data['categories']:
            mock_data['categories'][old_category]['news_count'] -= 1
        if new_category in mock_data['categories']:
            mock_data['categories'][new_category]['news_count'] += 1
    return jsonify({"success": True, "id": news_id})

# 后台接口：删除新闻
@api.route('/api/admin/news/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    news_index = next((i for i, item in enumerate(mock_data['news']) if item['id'] == news_id), None)
    if news_index is None:
        return jsonify({"detail": "News not found"}), 404
    category = mock_data['news'][news_index]['category']
    mock_data['news'].pop(news_index)
    if category in mock_data['categories']:
        mock_data['categories'][category]['news_count'] -= 1
    return jsonify({"success": True})

# 新增接口：从 Redis 中获取爬虫存入的 CNN 文章数据
@api.route('/api/admin/news/cnn', methods=['GET'])
def get_cnn_news():
    cache_key = "cnn_articles"
    cached_data = redis_client.get(cache_key)
    if cached_data:
        current_app.logger.info("[Mock API] 从 Redis 缓存中获取 CNN 文章数据")
        return jsonify(json.loads(cached_data))
    else:
        current_app.logger.info("[Mock API] Redis 中未找到 CNN 文章数据")
        return jsonify({"error": "No CNN articles cached"}), 404
