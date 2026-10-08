# Testing OJ

浏览器自测站，包含辽宁省赛 2025、ICPC 亚洲东部 2026 网络赛第一场和第二场。分享网站链接，朋友就能在自己的浏览器中编译 C++、运行 Python 和开始五小时虚拟比赛，不需要安装编译器或运行服务器。

## 功能

- JetBrains 风格的深色工作区、浅色主题、手机布局。
- 独立比赛入口，三场比赛选项卡，共 39 题（13 + 14 + 12）。
- 开赛自动进入禅模式；继续比赛回到上次题目，Esc 或右上角按钮退出。
- 界面、题面和代码字体分别可调，自动保存设置。
- 侧栏、题面/代码、代码/测试、输入/输出分隔线均可拖动；双击还原，也支持方向键。布局随刷新保留，手机使用上下分隔线。
- 代码区可开启或关闭；纯阅读时题面铺满工作区，草稿保留。顶部题号按钮和选择框直接切题，保留比赛计时与禅模式。
- 每题 15 个不同输入的自测点，包括 3 个 trick 点；共 585 组。
- 39 道题全部采用站内文本和 KaTeX 公式，保留原题图片、约束、样例及说明，不嵌入 PDF 阅读器。
- 39 份独立 PDF 和三份带目录封面的合并题面。
- C++17 / C++20 / C++23：实际 Clang 22.1.8 / libc++ / WASI SDK 33，均使用 `-O2`，本仓库包含运行环境和许可。支持 UTF-8 注释和 long double 运算、输入输出。
- Python：Pyodide，首次运行从 jsDelivr 加载运行环境。
- PyPy3：可下载本机助手，Windows 双击启动，首次从 Python 官方下载站获取 PyPy3；Linux / macOS 使用已安装的 PyPy3。仍由使用者自己的电脑执行，无需服务器。
- 在 Web Worker 中运行，单组自测最多 10 秒，标准输出最多 2 MiB。
- 构造题校验不同合法答案；几何题使用原题的浮点误差规则；第二场 H 提供本地交互器，校验查询回复、次数上限和最终答案。
- 自定义输入与预期输出、五小时计时、ICPC 罚时、自测榜。
- 每场比赛独立保存代码、计时和提交记录，兼容旧版记录及备份。

**数据范围：公开样例、自行生成的小规模穷举数据和可精确求解的边界数据，不是官方隐藏测试。Passed 只表示这 15 个自测点通过，不等于原比赛 AC。** 复杂题的生成数据以小规模为主；第二场 B 当前生成数据仅覆盖长方形，不能据此判断任意凸多边形算法正确性。所有人的代码和记录保存在各自浏览器里。浏览器 WebAssembly 的性能和 ABI 与原比赛不同，页面显示的原赛时限仅供参考。

交互题 H 的自定义输入格式为 `T`，之后每组为 `n` 和一个从 0 开始的隐藏排列。程序会收到题目规定的 `T`、`n` 和查询回复，不会直接收到隐藏排列。官方样例是交互记录；题面中的“交互自测”按钮会载入可运行的本地场景。

首次运行需要网络下载运行环境（C++ 约 29 MB，Python 约 12 MB）。浏览器的缓存会减少后续下载。C++ 使用 Clang 22.1.8 和 libc++，提供兼容的 `bits/stdc++.h`；WASM32 的 `long` 为 32 位，64 位整数请使用 `long long` / `int64_t`。支持范围以工具链为准，不能保证所有 GCC 扩展或标准库新特性均可使用。

PyPy3 不是 Pyodide 的别名，需要真正的本机解释器。在工作区设置中下载助手，解压后双击「启动 PyPy3.cmd」，保持窗口打开，在助手自动打开的网站选择 PyPy3。首次启动下载约 31 MB；浏览器若询问本地网络访问权限，请允许。连接令牌自动接收并从地址栏移除，不包含在导出的备份里。其他使用者启动自己的助手即可。跨平台使用说明见 `public/local/README.md`。

## 本地开发

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。

```sh
npm run build
npm run preview
```

构建输出在 `dist/`。使用相对资源路径和 hash 路由，适用于 GitHub Pages 的仓库子路径。

## GitHub Pages

仓库：<https://github.com/Math-DUT/Testing-OJ>

1. 在仓库 Settings → Pages → Build and deployment 中，选择 **GitHub Actions**。
2. 将代码推送到 `main`，自动运行 `.github/workflows/pages.yml`。
3. 部署成功后访问 <https://math-dut.github.io/Testing-OJ/>。

网站无服务器、数据库或 API 密钥。分享链接即可使用；代码不会由网站上传到评测服务器。

## 题面与 PDF

来源核对：

- [Codeforces Gym 106380](https://codeforces.com/gym/106380)
- [洛谷官方重现赛 291968](https://www.luogu.com.cn/contest/291968)
- 洛谷 P14581–P14593 / QOJ 14742–14754。
- [2026 ICPC Asia EC 官方参赛手册](https://hkucpc.github.io/icpc-aec-info/51/online-handbook/)
- [2026 网络赛第一场 · QOJ 4071](https://qoj.ac/contest/4071)，题目 20016–20029。
- [2026 网络赛第二场 · QOJ 4113](https://qoj.ac/contest/4113)，题目 20236–20247。

`src/problems.json` 与 `src/data/icpc-online-2026-*.json` 保存题面、公开样例和自测点；`statements/` 保存 Markdown 源稿；`public/pdf/` 保存供下载的 PDF。39 道题在网站中均为原生文本，第一场按原始 PDF 逐题转写并核对公式和数据范围。独立 PDF 保留原有排版，下载入口不影响站内阅读。

修改第一场 Markdown 后运行 `python scripts/sync-online-text.py`，只更新题面，不修改公开样例、校验器或自测点。

更新原始题面（Python 3，仅用标准库）：

```sh
python scripts/import-problems.py
```

导入网络赛（需要 `curl_cffi`、`pymupdf`、`beautifulsoup4`、`markdownify`；缓存放在 `tmp/sources/`）：

```sh
python scripts/import-online.py
```

导入原始题面后生成自测点：

```sh
python scripts/generate-tests.py
node scripts/validate-tests.mjs
python scripts/test-data/verify-oracles.py
```

参考算法在 `scripts/test-data/`；随机种子由比赛和题号的 SHA-256 决定。`src/data/test-manifest.json` 记录每题的数量、trick 数量、参考模块和数据校验值。穷举参考实现用来验证小规模数据，不作为高效题解。

重新生成 PDF：

```sh
npx playwright install chromium
npm run pdf
node scripts/build-pdfs.mjs icpc-online-2026-1
node scripts/build-pdfs.mjs icpc-online-2026-2
```

也可设置 `BROWSER_BIN` 为本机 Chrome / Chromium 可执行文件的绝对路径。中文排版需要系统安装 SimSun 或 Noto Serif CJK SC。

## 验证

```sh
npx playwright install chromium
npm test
```

测试覆盖全部 39 个原生题面、公式、顶部切题、拖动与布局持久化、代码区开关、草稿、比赛计时、禅模式、手机布局、PDF 下载、旧版记录迁移，以及真实 C++ / Python 的正常、错误、超时和交互执行。新增 C++17/20/23 标准与 O2 宏检查，使用用户给出的 Bread 长双精度代码回归验证三种标准下的 15 个自测点。设置 `PYPY_BIN` 为真正的 PyPy3 可执行文件可运行本机助手测试。

更新运行环境：`node scripts/vendor-cpp-runtime.mjs`，依赖和版本由 npm lockfile 固定。`public/runtime/cpp22/bin/printscan-long-double.a` 来自 WASI SDK 33，校验值与许可记录在该目录的 THIRD-PARTY-NOTICES.md。`python scripts/package-helper.py` 重新打包 PyPy3 助手。

## 许可

本项目自行编写的程序代码采用 MIT 许可。赛题文字、图片、样例属于原命题组与相应权利人，不属于本项目的 MIT 授权范围。题面中保留原题来源。

Clang WASM 使用 [live-codes/clang-wasm](https://github.com/live-codes/clang-wasm)、LLVM 和 WASI SDK 33，固定版本、文件 SHA-256 和许可保存在 `public/runtime/cpp22/`。Pyodide、PyPy、KaTeX、JetBrains Mono 和其他依赖遵循各自许可。
