#!/bin/bash
# status.command — 检查灵感站本地服务状态

PLIST_NAME="com.inspiration-station.bridge.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "=== 灵感站本地服务状态 ==="
echo ""

# 1) LaunchAgent 是否安装
if [ -f "$PLIST_DEST" ]; then
    echo "✅ LaunchAgent: 已安装（$PLIST_DEST）"
    LAUNCH_STATUS=$(launchctl list | grep "com.inspiration-station.bridge" || echo "未运行")
    echo "   运行状态: $LAUNCH_STATUS"
else
    echo "❌ LaunchAgent: 未安装（双击 install.command 装上）"
fi

echo ""

# 2) 端口检查
if lsof -i :8765 &> /dev/null; then
    PID=$(lsof -t -i:8765 | head -1)
    echo "✅ 端口 8765: 在跑（PID: $PID）"
    echo ""
    # 3) 健康检查
    HEALTH=$(curl -s --max-time 3 http://localhost:8765/health 2>&1)
    if echo "$HEALTH" | grep -q '"ok": true'; then
        echo "✅ 健康检查通过"
        echo "   响应: $HEALTH"
    else
        echo "⚠️  端口在但健康检查失败"
        echo "   响应: $HEALTH"
    fi
else
    echo "❌ 端口 8765: 空闲（服务未跑）"
fi

echo ""
echo "（按任意键关闭）"
read -n 1
