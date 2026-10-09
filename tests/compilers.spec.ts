import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

test("actual C++ standards, O2, UTF-8 and the user's long double solution", async ({
  page,
}) => {
  await page.goto("/#contest/icpc-online-2026-2/problem/B");
  const source = fs.readFileSync("tests/fixtures/bread.cpp", "utf8");
  const replaceCode = async (code: string) => {
    await page.locator(".cm-content").click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.insertText(code);
  };
  await replaceCode(source);
  for (const language of ["cpp", "cpp20", "cpp23"]) {
    await page.getByLabel("语言").selectOption(language);
    await page.getByRole("button", { name: "提交自测", exact: true }).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(15, {
      timeout: 180000,
    });
  }
  await page.getByRole("button", { name: "自定义", exact: true }).click();
  for (const [language, standard, features] of [
    ["cpp", "201703L", "std::cout << 42;"],
    [
      "cpp20",
      "202002L",
      "std::vector<int> a={42}; std::span<int> s(a); std::cout << *std::ranges::begin(s);",
    ],
    ["cpp23", "202302L", 'std::expected<int,int> a=42; std::println("{}",*a);'],
  ]) {
    await page.getByLabel("语言").selectOption(language);
    const headers =
      language === "cpp"
        ? ""
        : language === "cpp20"
          ? "#include <span>\n#include <ranges>"
          : "#include <expected>\n#include <print>";
    await replaceCode(
      `#include <bits/stdc++.h>\n${headers}\n#ifndef __OPTIMIZE__\n#error O2 missing\n#endif\nstatic_assert(__cplusplus == ${standard});\n// 中文注释与 UTF-8 字符串\nint main(){ ${features} }`,
    );
    await page.getByLabel("标准输入", { exact: true }).fill("");
    await page.getByLabel("预期输出", { exact: true }).fill("42");
    await page.getByRole("button", { name: "运行", exact: true }).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(1, {
      timeout: 180000,
    });
  }
});

test("real local PyPy3 executes, reports WA/CE/TLE and enforces the interactive protocol", async ({
  page,
}) => {
  test.skip(
    !process.env.PYPY_BIN,
    "Set PYPY_BIN to run against a real PyPy3 installation",
  );
  let child: ChildProcess | undefined;
  try {
    child = spawn(
      process.env.PYPY_BIN!,
      ["public/local/testing_oj_runner.py", "--no-browser"],
      { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] },
    );
    const token = await new Promise<string>((resolve, reject) => {
      let output = "";
      const timer = setTimeout(
        () => reject(Error("PyPy helper did not start")),
        10000,
      );
      child!.on("exit", () => {
        clearTimeout(timer);
        reject(Error("PyPy helper exited"));
      });
      child!.stdout!.on("data", (chunk) => {
        output += chunk.toString();
        const match = output.match(/local-runner=([a-zA-Z0-9_-]+)/);
        if (match) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
    });
    await page.goto(`/?local-runner=${token}#problem/C`);
    expect(page.url()).not.toContain(token);
    const large = await page.evaluate(async () => {
      const helper = await import("/src/localRunner.ts");
      await helper.localRunnerHealth();
      const input = "1".repeat(3 * 1024 * 1024);
      const result = await helper.executePyPy("import sys\ns=sys.stdin.read()\nprint('x'*len(s))", input, false, 8 * 1024 * 1024);
      return { status: result.status, size: result.output.length, error: result.error };
    });
    expect(large.status, large.error).toBe("OK");
    expect(large.size).toBeGreaterThan(3 * 1024 * 1024);
    await page.getByLabel("语言").selectOption("pypy3");
    await page
      .locator(".cm-content")
      .fill(
        "import platform\nassert platform.python_implementation() == 'PyPy'\na,b=input().split()\nprint(int(int(b[:-1])>=int(a[:-1])))",
      );
    await page.getByRole("button", { name: "提交自测", exact: true }).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(15, {
      timeout: 30000,
    });
    for (const [source, verdict] of [
      ["print(0)", "WA"],
      ["print(", "CE"],
      ["while True: pass", "TLE"],
    ]) {
      await page.locator(".cm-content").fill(source);
      await page.getByRole("button", { name: "运行", exact: true }).click();
      await expect(
        page.locator(".test-results .verdict.fail").first(),
      ).toHaveText(new RegExp(verdict), { timeout: 20000 });
    }
    await page.goto("/#contest/icpc-online-2026-2/problem/H");
    await page.getByRole("button", { name: "自定义", exact: true }).click();
    await page.getByLabel("标准输入", { exact: true }).fill("1\n1\n0\n");
    await page
      .locator(".cm-content")
      .fill(
        "import sys\ninput()\ninput()\nprint('debug',file=sys.stderr)\nprint('! 0',flush=True)",
      );
    await page.getByRole("button", { name: "运行", exact: true }).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(1);
    await page.getByRole("button", { name: "自定义", exact: true }).click();
    await page
      .getByLabel("标准输入", { exact: true })
      .fill("3\n1\n0\n3\n1 0 2\n4\n1 3 0 2\n");
    await page
      .locator(".cm-content")
      .fill(fs.readFileSync("tests/fixtures/hidden-track.py", "utf8"));
    await page.getByRole("button", { name: "运行", exact: true }).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(1);
    await expect(page.locator(".test-results pre").first()).toContainText("?");
    await page.getByRole("button", { name: "自定义", exact: true }).click();
    await page.getByLabel("标准输入", { exact: true }).fill("1\n3\n1 0 2\n");
    await page.locator(".cm-content").fill("print('! 0 1 2')");
    await page.getByRole("button", { name: "运行", exact: true }).click();
    await expect(
      page.locator(".test-results .verdict.fail").first(),
    ).toHaveText(/WA/);
    await expect(page.locator(".error-output")).toContainText(
      "隐藏排列重建错误",
    );
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.route("http://127.0.0.1:27121/health", route => route.fulfill({
      contentType: "application/json", body: JSON.stringify({ pypy3: true, version: "old" }),
    }));
    const outdated = await page.evaluate(async () => {
      const helper = await import("/src/localRunner.ts");
      await helper.localRunnerHealth();
      return await helper.executePyPy("print(1)", "", false, 8 * 1024 * 1024);
    });
    expect(outdated.status).toBe("ERROR");
    expect(outdated.error).toContain("重新下载");
  } finally {
    child?.kill();
  }
});
