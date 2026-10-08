# Testing OJ

辽宁省赛 2025 浏览器自测站。把网站链接发给朋友，他们就能在自己的浏览器中编译 C++、运行 Python、读取题面和开始五小时虚拟比赛，不需要安装编译器或运行服务器。

## 功能

- JetBrains 风格的深色工作区、浅色主题、手机布局。
- 第六届辽宁省大学生程序设计竞赛 A–M 全部 13 题，完整中文题面、数学公式与原题图片。
- 13 份重新排版的独立 PDF，以及带目录封面的合并题面。
- C++17：Clang / LLVM WebAssembly，本仓库包含运行环境和许可。
- Python：Pyodide，首次运行从 jsDelivr 加载运行环境。
- 在 Web Worker 中运行，单组自测最多 10 秒，标准输出最多 2 MiB。
- 全部公开样例、自定义输入和预期输出，A / B / L 支持不同合法输出的校验。
- 五小时计时、ICPC 罚时、自测榜、代码自动保存、提交记录、备份导入导出。

**数据范围：内置 16 组公开样例，没有官方隐藏测试数据。Passed 只表示自测通过，不等于原比赛 AC。** 所有人的代码和记录保存在各自浏览器里；不存在全站共享账户或排行榜。浏览器 WebAssembly 的性能和 ABI 与原比赛不同，页面显示的原赛时限仅供参考。

首次运行需要网络下载运行环境（C++ 约 60 MB，Python 约 12 MB）。浏览器的缓存会减少后续下载。C++ 使用 Clang 8 和 libc++，提供兼容的 `bits/stdc++.h`，不提供 GCC 扩展 `__gnu_pbds`；WASM32 的 `long` 为 32 位，64 位整数请使用 `long long` / `int64_t`。推荐桌面版 Chrome / Edge / Firefox。

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

`src/problems.json` 保存结构化题面和样例，`statements/` 保存 Markdown 源稿，`public/pdf/` 保存最终 PDF。PDF 使用 KaTeX 进行 LaTeX 公式排版，再由 Chromium 输出 A4，带题号、中文标题、英文标题、资源限制、输入输出、样例、说明和页码。

更新原始题面（Python 3，仅用标准库）：

```sh
python scripts/import-problems.py
```

重新生成 PDF：

```sh
npx playwright install chromium
npm run pdf
```

也可设置 `BROWSER_BIN` 为本机 Chrome / Chromium 可执行文件的绝对路径。中文排版需要系统安装 SimSun 或 Noto Serif CJK SC。

## 验证

```sh
npx playwright install chromium
npm test
```

测试覆盖题目清单、PDF 文件、移动端布局、计时与持久化、真实 C++ / Python 运行、错误结果，以及构造题 checker。测试通过之后不会生成假提交填充界面。

## 许可

本项目自行编写的程序代码采用 MIT 许可。赛题文字、图片、样例属于原命题组与相应权利人，不属于本项目的 MIT 授权范围。题面中保留原题来源。

Clang WASM 来源于 [binji/wasm-clang](https://github.com/binji/wasm-clang)，固定版本、文件 SHA-256 和许可保存在 `public/runtime/cpp/`。Pyodide、KaTeX、JetBrains Mono 和其他依赖遵循各自许可。
