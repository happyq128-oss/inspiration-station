#!/bin/bash
# start.command — 灵感站本地桥接服务启动器
# 双击此文件即可在 Mac 上启动本地服务（用于在 Finder 中打开灵感文件）

cd "$(dirname "$0")"

# 检查 python3
if ! command -v python3 &> /dev/null; then
    osascript -e 'display dialog "未找到 python3，请先安装 Python 3" buttons {"OK"} default button "OK" with icon caution'
    exit 1
fi

# 检查端口 8765 是否已被占用（服务可能已经在跑）
if lsof -i :8765 &> /dev/null; then
    osascript -e 'display dialog "灵感站本地服务已经在运行中" buttons {"OK"} default button "OK" with title "灵感站"'
    exit 0
fi

# 打开 Terminal 显示日志（这样用户能看到服务在跑）
# 用 osascript 启动 Terminal.app 跑同一个脚本
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$PWD' && python3 inspiration_bridge.py"
end tell
EOF

echo "✅ 灵感站本地服务启动指令已发送"
echo "   浏览器请打开 http://localhost:8765/health 检查"
echo "   日志在 ~/.inspiration-station-bridge.log"
exit 0
