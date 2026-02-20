#!/bin/bash
# EdgeSeeker 后端启动脚本

cd "$(dirname "$0")"

echo "🚀 启动 EdgeSeeker 后端..."

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "❌ 未找到 uv，请先安装: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# 同步依赖
echo "📦 同步依赖..."
uv sync

# 启动 FastAPI 应用
echo "✅ 启动 FastAPI 服务 (端口 8001)..."
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
