# PyPy3 本机助手

Windows：解压整个文件夹，双击「启动 PyPy3.cmd」。首次启动自动从 Python 官方下载站下载 PyPy3.11 v8.0.0，之后可直接启动。保持助手窗口打开，在自动打开的 Testing OJ 中选择「PyPy3 · 本机」。浏览器询问本地网络访问权限时允许，代码在使用者自己的电脑上运行。

Linux / macOS：先从 https://pypy.org/download.html 安装 PyPy3，然后在此目录运行：

```sh
pypy3 testing_oj_runner.py
```

如 PyPy3 不在 PATH，可运行 `python3 testing_oj_runner.py --pypy /绝对路径/pypy3`。助手会验证解释器确实为 PyPy，不会用 CPython 代替。

每次启动使用不同连接令牌，助手打开的页面会自动接收令牌并从地址栏移除。分享普通网站链接即可，其他使用者启动各自的助手。助手仅监听本机 127.0.0.1:27121，不需要服务器。浏览器 C++17/20/23 和 Python 原有运行方式可直接使用。

本机程序最多运行 10 秒，stdout/stderr 分别限制 2 MiB；支持 Hidden Track 的真实交互协议。助手在独立临时目录执行个人代码；它不是用于接收陌生提交的服务器沙箱。

退出助手：Ctrl+C。PyPy 存放在 Windows `%LOCALAPPDATA%/TestingOJ/`。下载包校验值固定在 `start-pypy.ps1`，来源为 Python 官方下载站。PyPy 保留其发行包许可。
