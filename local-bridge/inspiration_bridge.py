#!/usr/bin/env python3
# inspiration_bridge.py
# 灵感站本地桥接服务（Mac）
# 作用：让网页能在 Finder 中"显示"灵感对应的本地文件
# - 监听 localhost:8765（只本机访问）
# - 提供 /reveal?path=xxx → mac 上执行 `open -R /path`（在 Finder 中显示）
# - 提供 /open?path=xxx → `open /path`（用默认 app 打开）
# - 提供 /health → 检查服务是否在线
#
# 安全：
# - 启动时随机生成 token，存 ~/.inspiration-station-token
# - 所有写操作（reveal/open）必须带正确 token
# - 只监听 localhost，不对外暴露
#
# 启动：
#   python3 inspiration_bridge.py
# 或双击配套的 start.command

import http.server
import socketserver
import subprocess
import os
import sys
import json
import secrets
import urllib.parse
import base64
from pathlib import Path

PORT = 8765
TOKEN_FILE = Path.home() / '.inspiration-station-token'
LOG_FILE = Path.home() / '.inspiration-station-bridge.log'

# ============== Token 管理 ==============

def get_or_create_token():
    """获取或创建 token（首次启动生成，之后复用）"""
    if TOKEN_FILE.exists():
        token = TOKEN_FILE.read_text().strip()
        if token:
            return token
    # 首次启动：生成随机 token
    token = secrets.token_urlsafe(32)
    TOKEN_FILE.write_text(token)
    # 设置文件权限为仅本人可读写
    os.chmod(TOKEN_FILE, 0o600)
    log(f"Created new token at {TOKEN_FILE}")
    return token

# ============== 日志 ==============

def log(msg):
    import datetime
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{ts}] {msg}\n"
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(line)
    except Exception:
        pass
    print(line, end='')

# ============== 路径校验 ==============

def is_safe_path(path):
    """防止注入：只允许绝对路径，不允许特殊字符"""
    if not path or not isinstance(path, str):
        return False
    # 必须是绝对路径
    if not path.startswith('/'):
        return False
    # 禁止 ..（防止路径穿越）
    if '..' in path:
        return False
    return True

# ============== HTTP Handler ==============

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # 重写默认 log，转到我们的 log
        log(f"{self.address_string()} - {format % args}")

    def _send_json(self, status, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')  # 允许 Netlify 站点调用
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Bridge-Token')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/health':
            return self._send_json(200, {
                'ok': True,
                'service': 'inspiration-bridge',
                'version': '1.0',
                'pid': os.getpid(),
            })

        if parsed.path in ('/reveal', '/open'):
            return self._handle_reveal_or_open(parsed.path, params)

        if parsed.path == '/token':
            # 返回 token（供网页端从 Netlify 端点中转读取时使用）
            # 实际场景：网页端不需要单独调这个，token 通过 Netlify 函数启动时同步
            return self._send_json(200, {'token': get_or_create_token()})

        return self._send_json(404, {'error': 'not found'})

    def do_POST(self):
        """处理 POST 请求：/pick-files（弹 Finder 选图）和 /read-file（读图 base64）"""
        parsed = urllib.parse.urlparse(self.path)

        # 读 body
        content_length = int(self.headers.get('Content-Length', 0))
        body = b''
        if content_length > 0:
            body = self.rfile.read(content_length)
        try:
            data = json.loads(body) if body else {}
        except Exception:
            data = {}

        # 所有 POST 都要校验 token
        provided_token = (
            data.get('token')
            or self.headers.get('X-Bridge-Token')
        )
        expected = get_or_create_token()
        if provided_token != expected:
            log(f"AUTH FAIL (POST): provided={provided_token[:8] if provided_token else 'None'}...")
            return self._send_json(401, {'error': 'unauthorized'})

        if parsed.path == '/pick-files':
            return self._handle_pick_files(data)
        elif parsed.path == '/read-file':
            return self._handle_read_file(data)

        return self._send_json(404, {'error': 'not found'})

    def _handle_pick_files(self, data):
        """弹 mac Finder 文件选择器，让用户选图，返回路径列表"""
        allow_multiple = data.get('multiple', True)  # 默认允许多选
        file_type = data.get('type', 'image')

        # AppleScript：根据 file_type 选不同的 type
        if file_type == 'image':
            # public.image 覆盖 jpg/png/heic 等
            as_type = 'public.image'
        else:
            as_type = ''  # 不限类型

        # 多选 / 单选
        if allow_multiple:
            multi_clause = 'with multiple selections allowed'
        else:
            multi_clause = ''

        ascript = f'''
        set theFiles to choose file with prompt "选择要索引的图片" of type {{"{as_type}"}} {multi_clause}
        set thePaths to {{}}
        repeat with f in theFiles
            set end of thePaths to POSIX path of f
        end repeat
        return thePaths
        '''

        try:
            log(f"EXEC osascript pick-files (multiple={allow_multiple})")
            result = subprocess.run(
                ['osascript', '-e', ascript],
                capture_output=True,
                text=True,
                timeout=120,  # 用户可能在 Finder 里慢慢选
            )
            if result.returncode != 0:
                # 用户取消（User canceled.）也算非 0
                if 'User canceled' in result.stderr or 'User cancelled' in result.stderr:
                    log("User cancelled Finder picker")
                    return self._send_json(200, {'files': [], 'cancelled': True})
                log(f"osascript error: {result.stderr}")
                return self._send_json(500, {'error': result.stderr.strip() or 'osascript failed'})

            # 解析返回：AppleScript list → Python list
            # 返回格式：path1, path2, path3（用逗号分隔，但路径里可能含逗号...）
            # 用更安全的方式：each line is a path
            raw = result.stdout.strip()
            if not raw:
                return self._send_json(200, {'files': [], 'cancelled': True})

            # AppleScript 列表返回值：{path1, path2, ...}（有花括号）
            # 提取每条路径
            paths = []
            # 去掉外层花括号
            inner = raw.strip('{}').strip()
            # 按 ", " 分割（AppleScript 用 ", " 分隔 list 项）
            for line in inner.split(', '):
                p = line.strip().strip('"').strip()
                if p and os.path.exists(p):
                    paths.append(p)
                elif p:
                    log(f"Path doesn't exist: {p}")

            # 为每条路径计算父目录信息
            files_info = []
            for p in paths:
                parent = os.path.dirname(p)
                parent_name = os.path.basename(parent)
                grandparent = os.path.dirname(parent)
                grandparent_name = os.path.basename(grandparent)
                files_info.append({
                    'path': p,
                    'name': os.path.basename(p),
                    'parentDir': parent_name,
                    'grandparentDir': grandparent_name,
                })

            log(f"Picker returned {len(files_info)} files")
            return self._send_json(200, {'files': files_info})

        except subprocess.TimeoutExpired:
            return self._send_json(500, {'error': 'Finder 选择超时'})
        except Exception as e:
            log(f"pick-files error: {e}")
            return self._send_json(500, {'error': str(e)})

    def _handle_read_file(self, data):
        """读图文件，返回 base64（让 Netlify 入库时用）"""
        path = data.get('path', '').strip()
        if not path:
            return self._send_json(400, {'error': 'missing path'})
        path = urllib.parse.unquote(path)

        if not is_safe_path(path):
            return self._send_json(400, {'error': 'invalid path'})

        if not os.path.exists(path):
            return self._send_json(404, {'error': f'file not found: {path}'})

        # 限制大小：单文件 50MB（Netlify 6MB 限制，所以实际应该 <= 5MB）
        try:
            file_size = os.path.getsize(path)
            if file_size > 50 * 1024 * 1024:
                return self._send_json(400, {'error': f'文件太大 ({file_size//1024//1024}MB)，超过 50MB 限制'})

            with open(path, 'rb') as f:
                raw = f.read()
            b64 = base64.b64encode(raw).decode('utf-8')

            # 推断 mime type
            ext = os.path.splitext(path)[1].lower()
            mime_map = {
                '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.heic': 'image/heic', '.heif': 'image/heif',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
            }
            mime = mime_map.get(ext, 'application/octet-stream')

            log(f"read-file {path}: {file_size}B -> base64")
            return self._send_json(200, {
                'base64': b64,
                'mime': mime,
                'size': file_size,
            })
        except Exception as e:
            log(f"read-file error: {e}")
            return self._send_json(500, {'error': str(e)})

    def _handle_reveal_or_open(self, action, params):
        # 校验 token
        provided_token = (
            params.get('token', [None])[0]
            or self.headers.get('X-Bridge-Token')
        )
        expected = get_or_create_token()
        if not provided_token or provided_token != expected:
            log(f"AUTH FAIL: provided={provided_token[:8] if provided_token else 'None'}...")
            return self._send_json(401, {'error': 'unauthorized'})

        # 校验路径
        path = params.get('path', [None])[0]
        if not path:
            return self._send_json(400, {'error': 'missing path'})
        # URL decode
        path = urllib.parse.unquote(path)
        if not is_safe_path(path):
            return self._send_json(400, {'error': 'invalid path (must be absolute, no ..)'})

        if not os.path.exists(path):
            return self._send_json(404, {'error': f'path not found: {path}'})

        # 执行 open 命令
        try:
            if action == '/reveal':
                # `open -R path` 在 Finder 中显示（高亮文件）
                cmd = ['open', '-R', path]
            else:
                # `open path` 用默认 app 打开
                cmd = ['open', path]
            log(f"EXEC: {' '.join(cmd)}")
            subprocess.run(cmd, check=True, timeout=5)
            return self._send_json(200, {
                'ok': True,
                'action': action,
                'path': path,
            })
        except subprocess.TimeoutExpired:
            return self._send_json(500, {'error': 'open command timeout'})
        except subprocess.CalledProcessError as e:
            return self._send_json(500, {'error': f'open failed: {e}'})
        except Exception as e:
            return self._send_json(500, {'error': str(e)})


def main():
    token = get_or_create_token()
    log(f"=== Inspiration Bridge started on port {PORT}, pid={os.getpid()} ===")
    log(f"Token file: {TOKEN_FILE}")
    log(f"Log file: {LOG_FILE}")
    print(f"\n🟢 灵感站本地桥接服务已启动")
    print(f"   端口: http://localhost:{PORT}")
    print(f"   Token: {token[:12]}...（完整存于 {TOKEN_FILE}）")
    print(f"   日志: tail -f {LOG_FILE}")
    print(f"\n按 Ctrl+C 停止\n")

    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), BridgeHandler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"\n❌ 端口 {PORT} 已被占用。可能服务已在运行？")
            print(f"   检查: lsof -i :{PORT}")
            print(f"   杀掉: kill $(lsof -t -i:{PORT})")
            sys.exit(1)
        raise
    except KeyboardInterrupt:
        print("\n\n🟡 桥接服务已停止")


if __name__ == '__main__':
    main()
