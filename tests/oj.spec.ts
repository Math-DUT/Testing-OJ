import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("contest, PDF links, search, timer and persisted records", async ({
  page,
}) => {
  await page.goto("/#contest/lncpc-2025");
  await expect(page.locator(".problem-row")).toHaveCount(13);
  await page.getByLabel("搜索题目").fill("Kanon");
  await expect(page.locator(".problem-row")).toHaveCount(1);
  await page.getByLabel("搜索题目").fill("");
  await page.getByRole("button", { name: "开始虚拟比赛" }).click();
  await expect(page.locator(".zen-timer")).toBeVisible();
  await page.reload();
  await expect(page.locator(".zen-timer")).toBeVisible();
  await page.getByRole("button", { name: "题目", exact: true }).click();
  for (const id of "ABCDEFGHIJKLM") {
    const response = await page.request.get(`/pdf/${id}.pdf`);
    expect(response.ok()).toBeTruthy();
    expect((await response.body()).subarray(0, 4).toString()).toBe("%PDF");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "tmp/preview/overview.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "tmp/preview/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("C++ and Python execute locally; PASS, WA, CE, TLE, persistence", async ({
  page,
}) => {
  await page.goto("/#problem/C");
  await page
    .locator(".cm-content")
    .fill(
      "#include <bits/stdc++.h>\nusing namespace std; int main(){string a,b;cin>>a>>b;cout<<(stoi(b)>=stoi(a));}",
    );
  await page.getByRole("button", { name: "提交自测", exact: true }).click();
  await expect(page.locator(".test-results .verdict.pass")).toHaveCount(15, {
    timeout: 180000,
  });
  await page.screenshot({ path: "tmp/preview/editor.png", fullPage: true });
  await page
    .getByRole("button", { name: "提交记录", exact: true })
    .first()
    .click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.goto("/#problem/C");
  await page.getByLabel("语言").selectOption("python");
  await page
    .locator(".cm-content")
    .fill("a, b = input().split()\nprint(int(int(b[:-1]) >= int(a[:-1])))");
  await page.getByRole("button", { name: "运行", exact: true }).click();
  await expect(page.locator(".test-results .verdict.pass")).toHaveCount(15, {
    timeout: 120000,
  });
  await page.locator(".cm-content").fill("print(0)");
  await page.getByRole("button", { name: "运行", exact: true }).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText(
    /WA/,
    { timeout: 30000 },
  );
  await page.locator(".cm-content").fill("print(");
  await page.getByRole("button", { name: "运行", exact: true }).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText(
    /CE/,
    { timeout: 30000 },
  );
  await page.locator(".cm-content").fill("while True: pass");
  await page.getByRole("button", { name: "运行", exact: true }).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText(
    /TLE/,
    { timeout: 45000 },
  );
});

test("constructive checkers accept different valid answers and reject malformed output", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { checkOutput } = await import("/src/checkers.ts" as string);
    return [
      checkOutput("mex", "1\n2\n1 2\n1 2\n", "2 0\n0 1", "0 0\n0 1"),
      checkOutput("mex", "1\n2\n1 2\n1 2\n", "0 0\n0 0", "0 0\n0 1"),
      checkOutput("keyboard", "1\n3 0\n", "1\n3 1\n", "1\n9 1"),
      checkOutput("keyboard", "1\n3 1\n3\n", "1\n3 1\n", "1\n9 1"),
      checkOutput("gulls", "1\n1\n1 1\n1 2\n", "Yes\n1 R\n", "Yes\n1 R\n"),
      checkOutput("gulls", "1\n1\n1 1\n1 2\n", "Yes\n1 L\n", "Yes\n1 R\n"),
    ];
  });
  expect(result).toEqual([true, false, true, false, true, false]);
});
