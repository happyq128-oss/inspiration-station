#!/bin/bash
# install.command — 安装灵感站本地服务为 mac 登录启动项
# 装完后完全后台跑，零窗口，开机自启，崩溃自动重启

set -e

cd "$(dirname "$0")"

SCRIPT_DIR="$(pwd)"
SCRIPT_PATH="$SCRIPT_DIR/inspiration_bridge.py"
PLIST_NAME="com.inspiration-station.bridge.plist"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
LOG_DIR="$HOME/Library/Logs"

# 1) 检查依赖
if [ ! -f "$SCRIPT_PATH" ]; then
    osascript -e 'display dialog "找不到 inspiration_bridge.py，请确认 local-bridge 文件夹完整" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    osascript -e 'display dialog "未找到 python3。请先安装 Python 3 或 Xcode Command Line Tools" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# 2) 如果当前已有前台实例在跑，先停掉（避免端口冲突）
if lsof -i :8765 &> /dev/null; then
    EXISTING_PID=$(lsof -t -i:8765)
    echo "发现已有进程占用 8765 端口（PID: $EXISTING_PID），先停掉..."
    kill $EXISTING_PID 2>/dev/null
    sleep 1
fi

# 3) 准备 LaunchAgents 目录
mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$LOG_DIR"

# 4) 生成 plist（替换路径占位符）
sed -e "s|__SCRIPT_PATH__|$SCRIPT_PATH|g" \
    -e "s|__SCRIPT_DIR__|$SCRIPT_DIR|g" \
    -e "s|__LOG_DIR__|$LOG_DIR|g" \
    "$PLIST_SRC" > "$PLIST_DEST"

chmod 644 "$PLIST_DEST"
echo "✓ plist 已写入: $PLIST_DEST"

# 5) 加载 plist（立即启动 + 设为登录启动）
launchctl unload "$PLIST_DEST" 2>/dev/null || true
launchctl load -w "$PLIST_DEST"
echo "✓ LaunchAgent 已加载（开机自启）"

# 6) 等待服务起来
sleep 2

# 7) 健康检查
HEALTH=$(curl -s --max-time 3 http://localhost:8765/health 2>&1 || echo "FAILED")
if echo "$HEALTH" | grep -q '"ok": true'; then
    echo ""
    echo "✅ 安装成功！服务已在后台运行"
    echo "   端口: http://localhost:8765"
    echo "   日志: $LOG_DIR/inspiration-bridge.out.log"
    echo ""
    osascript -e 'display dialog "灵感站本地服务安装成功！\n\n服务已在后台运行，开机自启，零窗口。\n\n日志位置：~/Library/Logs/inspiration-bridge.out.log\n\n如果以后想卸载，双击 uninstall.command" buttons {"OK"} default button "OK" with title "灵感站"'
else
    echo ""
    echo "⚠️  服务起来了但健康检查失败"
    echo "   响应: $HEALTH"
    echo "   日志: tail -f $LOG_DIR/inspiration-bridge.err.log"
fi
