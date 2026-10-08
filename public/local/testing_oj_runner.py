#!/usr/bin/env python3
"""Testing OJ personal PyPy3 bridge. Standard library only; binds to loopback."""
import argparse
import hmac
import json
import os
from pathlib import Path
import platform
import queue
import re
import secrets
import shutil
import subprocess
import tempfile
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_BYTES = 2 * 1024 * 1024
RUNS = {}
LOCK = threading.Lock()


class HiddenTrack:
    def __init__(self, text):
        a = list(map(int, text.split()))
        if not a or not 1 <= a[0] <= 10000:
            raise ValueError("隐藏排列格式不正确")
        self.paths = []
        i = 1
        for _ in range(a[0]):
            if i >= len(a):
                raise ValueError("隐藏排列格式不正确")
            n = a[i]
            p = a[i + 1:i + 1 + n]
            i += n + 1
            if not 1 <= n <= 10000 or sorted(p) != list(range(n)) or (n > 1 and p[0] >= p[-1]):
                raise ValueError("隐藏排列格式不正确")
            self.paths.append(p)
        if i != len(a):
            raise ValueError("隐藏排列格式不正确")
        self.index = self.queries = 0
        self.pending = self.error = ""
        self.stdin = str(len(self.paths)) + "\n" + str(len(self.paths[0])) + "\n"

    def fail(self, message):
        self.error = self.error or message
        return "-1\n"

    def write(self, text):
        self.pending += text
        response = ""
        while "\n" in self.pending:
            line, self.pending = self.pending.split("\n", 1)
            if not line.strip() or self.error:
                continue
            tokens = line.split()
            symbol, values = tokens[0], tokens[1:]
            if any(not re.fullmatch(r"-?\d+", x) for x in values):
                response += self.fail("交互输出包含无效整数")
                continue
            if self.index >= len(self.paths):
                response += self.fail("答案结束后仍有多余输出")
                continue
            a = list(map(int, values))
            p = self.paths[self.index]
            n, k = len(p), (len(p) - 1).bit_length()
            if symbol == "?":
                if len(a) != 2 or not 0 <= a[0] < 2**k or not -1 <= a[1] < n:
                    response += self.fail("查询参数超出范围")
                    continue
                self.queries += 1
                if self.queries > n * k:
                    response += self.fail("超过 n·ceil(log2(n)) 次查询限制")
                    continue
                m, v = a
                b = [((x & m).bit_count() & 1) ^ (x == v) for x in p]
                response += str(sum(x != y for x, y in zip(b, b[1:])) % 3) + "\n"
            elif symbol == "!":
                if a != p:
                    response += self.fail("隐藏排列重建错误")
                    continue
                self.index += 1
                self.queries = 0
                if self.index < len(self.paths):
                    response += str(len(self.paths[self.index])) + "\n"
            else:
                response += self.fail("交互输出必须以 ? 或 ! 开头")
        return response

    def finish(self):
        if self.pending.strip():
            self.write("\n")
        if not self.error and self.index != len(self.paths):
            self.error = "程序结束前没有回答全部隐藏排列"
        return {"status": "WA" if self.error else "PASS", "error": self.error}


def run_program(executable, source, input_text, interactive=False, run_id=""):
    judge = HiddenTrack(input_text) if interactive else None
    with tempfile.TemporaryDirectory(prefix="testing-oj-") as directory:
        path = Path(directory) / "main.py"
        path.write_text(source, encoding="utf-8")
        syntax = subprocess.run([executable, "-I", "-c", "import sys; compile(open(sys.argv[1], encoding='utf-8').read(), sys.argv[1], 'exec')", str(path)],
                                capture_output=True, timeout=5, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        if syntax.returncode:
            return {"status": "CE", "output": "", "error": syntax.stderr[:MAX_BYTES].decode("utf-8", errors="replace"), "time": 0}
        proc = subprocess.Popen([executable, "-I", "-u", str(path)], cwd=directory,
                                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                env={**os.environ, "PYTHONIOENCODING": "utf-8"},
                                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        with LOCK:
            RUNS[run_id] = proc
        events = queue.Queue(maxsize=64)
        done = threading.Event()

        def enqueue(item):
            while not done.is_set():
                try:
                    events.put(item, timeout=0.05)
                    return
                except queue.Full:
                    pass

        def collect(stream, channel):
            try:
                while not done.is_set():
                    data = stream.read1(4096)
                    if not data:
                        break
                    enqueue((channel, data))
            finally:
                enqueue((channel, None))

        def write_input(text, close=False):
            try:
                proc.stdin.write(text.encode("utf-8"))
                proc.stdin.flush()
                if close:
                    proc.stdin.close()
            except (BrokenPipeError, OSError):
                pass

        readers = [threading.Thread(target=collect, args=(proc.stdout, 1), daemon=True),
                   threading.Thread(target=collect, args=(proc.stderr, 2), daemon=True)]
        for reader in readers:
            reader.start()
        threading.Thread(target=write_input, args=(judge.stdin if judge else input_text, not judge), daemon=True).start()
        start = time.monotonic()
        out, err, count, finished, status = [], [], [0, 0], 0, "OK"
        # Decode once after collection, except interactive stdout which is ASCII protocol.
        try:
            while finished < 2:
                if time.monotonic() - start >= 10:
                    status = "TLE"
                    proc.kill()
                    break
                try:
                    channel, data = events.get(timeout=0.05)
                except queue.Empty:
                    continue
                if data is None:
                    finished += 1
                    continue
                count[channel - 1] += len(data)
                if count[channel - 1] > MAX_BYTES:
                    status = "OLE"
                    proc.kill()
                    break
                (out if channel == 1 else err).append(data)
                if channel == 1 and judge:
                    reply = judge.write(data.decode("utf-8", errors="replace"))
                    if reply:
                        write_input(reply)
            proc.wait(timeout=2)
        finally:
            if proc.poll() is None:
                proc.kill()
                proc.wait()
            done.set()
            for reader in readers:
                reader.join(timeout=1)
            proc.stdout.close()
            proc.stderr.close()
            with LOCK:
                RUNS.pop(run_id, None)
        result = {"status": status, "output": b"".join(out).decode("utf-8", errors="replace"),
                  "error": b"".join(err).decode("utf-8", errors="replace"),
                  "time": (time.monotonic() - start) * 1000}
        if status == "OK":
            if proc.returncode != 0:
                result.update(status="RE", error=result["error"] or "退出码 " + str(proc.returncode))
            elif judge:
                result.update(judge.finish())
        elif status == "TLE":
            result["error"] = "超过本机自测时限（10 秒）"
        elif status == "OLE":
            result["error"] = "输出超过 2 MiB"
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pypy", default=shutil.which("pypy3") or shutil.which("pypy"))
    parser.add_argument("--port", type=int, default=27121)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    if not args.pypy and platform.python_implementation() == "PyPy":
        import sys
        args.pypy = sys.executable
    if not args.pypy:
        parser.error("请安装 PyPy3 或使用 Windows 启动脚本。")
    probe = subprocess.check_output([args.pypy, "-c", "import platform,sys; print(platform.python_implementation()); print(sys.version.splitlines()[0])"], text=True)
    if not probe.startswith("PyPy\n"):
        parser.error("--pypy 必须指向真正的 PyPy3，不能使用 CPython。")
    token = secrets.token_urlsafe(32)
    allowed = {"https://math-dut.github.io", "http://127.0.0.1:5173", "http://localhost:5173"}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def authorized(self):
            return (self.headers.get("Origin") in allowed and
                    self.headers.get("Host") in {"127.0.0.1:" + str(args.port), "localhost:" + str(args.port)} and
                    hmac.compare_digest(self.headers.get("Authorization", ""), "Bearer " + token))

        def reply(self, status, data):
            self.send_response(status)
            origin = self.headers.get("Origin")
            if origin in allowed:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            try:
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_OPTIONS(self):
            if self.headers.get("Origin") not in allowed:
                self.reply(403, {})
                return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", self.headers["Origin"])
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.end_headers()

        def do_GET(self):
            if not self.authorized():
                self.reply(403, {})
                return
            self.reply(200 if self.path == "/health" else 404, {"pypy3": True, "version": probe.strip()})

        def do_POST(self):
            if not self.authorized():
                self.reply(403, {})
                return
            try:
                length = int(self.headers.get("Content-Length", 0))
                if not 0 < length <= 4 * MAX_BYTES:
                    raise ValueError("请求过大")
                data = json.loads(self.rfile.read(length))
                if self.path == "/cancel":
                    with LOCK:
                        proc = RUNS.get(data.get("id"))
                        if proc and proc.poll() is None:
                            proc.kill()
                    self.reply(200, {})
                    return
                if self.path != "/run":
                    self.reply(404, {})
                    return
                if any(not isinstance(data.get(k), str) or len(data[k].encode("utf-8")) > MAX_BYTES for k in ("source", "input")):
                    raise ValueError("代码或输入过大")
                self.reply(200, run_program(args.pypy, data["source"], data["input"], data.get("interactive") is True, str(data.get("id", ""))))
            except Exception as error:
                self.reply(400, {"status": "ERROR", "output": "", "time": 0, "error": str(error)})

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    url = "https://math-dut.github.io/Testing-OJ/?local-runner=" + token + "#contests"
    print("Testing OJ · PyPy3 本机助手已启动\n保持此窗口打开。Ctrl+C 退出。\n" + url, flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        with LOCK:
            for proc in RUNS.values():
                if proc.poll() is None:
                    proc.kill()


if __name__ == "__main__":
    main()
