#!/bin/bash
# 灵感工作台一键部署脚本
# 适用：阿里云/腾讯云 ECS + Alibaba Cloud Linux 3 / Ubuntu 22.04
# 用法：在服务器上 git clone 代码后，进入目录跑 ./deploy.sh

set -e

# 颜色（让提示更清楚）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 路径
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="/data/inspiration"
LOG_DIR="/var/log/inspiration"
USER_NAME="inspiration"

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}  灵感工作台 · 一键部署${NC}"
echo -e "${BLUE}  部署目录：${APP_DIR}${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"

# ============ 1. 检查系统 ============
echo -e "\n${YELLOW}[1/7] 检查系统环境${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "  系统：$PRETTY_NAME"
fi
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安装${NC}"
    echo "  请先在宝塔面板「软件商店」装 Node.js 20，再重跑此脚本"
    exit 1
fi
NODE_VER=$(node -v)
echo "  Node.js：$NODE_VER"

# 检查 Node 版本（需要 22.5+ 才能用 node:sqlite）
NODE_MAJOR=$(echo "$NODE_VER" | sed -E 's/v([0-9]+).*/\1/')
if [ "$NODE_MAJOR" -lt 22 ]; then
    echo -e "${RED}✗ Node.js 版本太低（需要 22+，当前 $NODE_VER）${NC}"
    echo "  宝塔「软件商店」→ 卸载当前 Node → 装 Node 20 改选 22"
    exit 1
fi

# ============ 2. 准备目录 ============
echo -e "\n${YELLOW}[2/7] 创建数据/日志目录${NC}"
mkdir -p "$DATA_DIR" "$DATA_DIR/images" "$LOG_DIR"
chmod 755 "$DATA_DIR" "$LOG_DIR"
echo "  数据目录：$DATA_DIR"
echo "  日志目录：$LOG_DIR"

# ============ 3. 安装依赖 ============
echo -e "\n${YELLOW}[3/7] 安装 Node 依赖${NC}"
cd "$APP_DIR"
if [ ! -f package.json ]; then
    echo -e "${RED}✗ package.json 不存在${NC}"
    echo "  请确认在灵感工作台代码目录里跑此脚本"
    exit 1
fi
npm install --production --no-audit --no-fund 2>&1 | tail -3

# ============ 4. 编译 functions ============
echo -e "\n${YELLOW}[4/7] 编译 Netlify Functions → Express 路由${NC}"
if [ ! -d node_modules/esbuild ]; then
    npm install --no-save esbuild --no-audit --no-fund 2>&1 | tail -3
fi
node scripts/build-functions.js

# ============ 5. 写入 .env ============
echo -e "\n${YELLOW}[5/7] 配置环境变量${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "  已创建 .env（请编辑填入 QWEN_API_KEY 等）"
    else
        cat > .env <<EOF
# 通义千问 API Key（必须）
QWEN_API_KEY=

# 数据后端
DATA_BACKEND=sqlite
DB_PATH=$DATA_DIR/inspiration.db

# 图片存储后端
IMAGE_BACKEND=local
IMAGE_DIR=$DATA_DIR/images

# 服务器
PORT=3000
NODE_ENV=production
LOG_REQUESTS=0

# API Token（鉴权用，自己设个复杂的）
API_TOKEN=$(openssl rand -hex 16)
EOF
        echo "  已创建 .env，API_TOKEN 已随机生成：$API_TOKEN"
    fi
    echo -e "${YELLOW}  ⚠️  请编辑 .env 填入 QWEN_API_KEY，然后重跑此脚本或直接 pm2 start 启动${NC}"
    echo "  nano .env"
    exit 0
fi

# ============ 6. 启动 PM2 ============
echo -e "\n${YELLOW}[6/7] 启动 PM2 守护进程${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "  安装 PM2..."
    npm install -g pm2 --no-audit --no-fund 2>&1 | tail -3
fi

# 创建 ecosystem 配置
cat > ecosystem.config.js <<'EOF'
module.exports = {
  apps: [{
    name: 'inspiration',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/inspiration/err.log',
    out_file: '/var/log/inspiration/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '800M',
    autorestart: true,
    watch: false,
  }]
};
EOF

# 启动
pm2 delete inspiration 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 配开机自启
echo "  配置开机自启..."
STARTUP_CMD=$(pm2 startup | grep -oE 'sudo.*pm2.*' | head -1)
if [ -n "$STARTUP_CMD" ]; then
    echo "  请手动执行下面这条命令完成开机自启："
    echo "  $STARTUP_CMD"
fi

# ============ 7. 验证 ============
echo -e "\n${YELLOW}[7/7] 验证服务${NC}"
sleep 2
HEALTH=$(curl -s --max-time 5 http://localhost:3000/api/health 2>&1)
if echo "$HEALTH" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ 服务已启动！${NC}"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🎉 部署成功！${NC}"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""
    echo "  内网访问：http://localhost:3000"
    echo "  公网访问：http://$(curl -s ifconfig.me):3000"
    echo ""
    echo "  常用命令："
    echo "    pm2 list              # 查看进程"
    echo "    pm2 logs inspiration  # 看实时日志"
    echo "    pm2 restart inspiration  # 重启"
    echo "    pm2 stop inspiration  # 停止"
    echo ""
    echo "  下一步：配置 Nginx 反向代理 + HTTPS 证书"
    echo "  （宝塔面板操作）"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
else
    echo -e "${RED}✗ 服务未正常响应${NC}"
    echo "  请查看日志：pm2 logs inspiration"
fi
