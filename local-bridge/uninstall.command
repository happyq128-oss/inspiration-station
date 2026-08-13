#!/bin/bash
# uninstall.command — 卸载灵感站本地服务
# 停掉后台进程 + 移除开机启动

PLIST_NAME="com.inspiration-station.bridge.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

# 1) 卸载（如果存在）
if [ -f "$PLIST_DEST" ]; then
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    rm -f "$PLIST_DEST"
    echo "✓ 已移除 LaunchAgent: $PLIST_DEST"
else
    echo "（未发现已安装的 LaunchAgent）"
fi

# 2) 杀掉还在跑的进程（兜底）
if lsof -i :8765 &> /dev/null; then
    PID=$(lsof -t -i:8765)
    kill $PID 2>/dev/null && echo "✓ 已停止服务进程 (PID: $PID)" || true
    sleep 1
fi

echo ""
osascript -e 'display dialog "灵感站本地服务已卸载。\n\n如果想重新启用，双击 install.command。" buttons {"OK"} default button "OK" with title "灵感站"'
