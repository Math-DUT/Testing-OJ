import { test, expect, type Locator, type Page } from "@playwright/test";

async function drag(page: Page, handle: Locator, dx: number, dy: number) {
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + dx,
    box.y + box.height / 2 + dy,
    { steps: 8 },
  );
  await page.mouse.up();
}
const size = async (element: Locator, axis: "width" | "height") =>
  (await element.boundingBox())![axis];

test("all 39 statements render as native text with valid math and direct problem choices", async ({
  page,
}) => {
  for (const [contest, ids] of [
    ["lncpc-2025", "ABCDEFGHIJKLM"],
    ["icpc-online-2026-1", "ABCDEFGHIJKLMN"],
    ["icpc-online-2026-2", "ABCDEFGHIJKL"],
  ]) {
    await page.goto(`/#contest/${contest}/problem/A`);
    await expect(
      page.getByRole("navigation", { name: "比赛题目" }).getByRole("button"),
    ).toHaveCount(ids.length);
    for (const id of ids) {
      await page.getByRole("button", { name: `题目 ${id}`, exact: true }).click();
      await expect(page.locator(".paper-heading small")).toHaveText(
        `Problem ${id}`,
      );
      await expect(page.locator("iframe, object, embed")).toHaveCount(0);
      await expect(page.locator(".statement")).toBeVisible();
      expect(await page.locator(".statement").innerText()).toMatch(
        /Input|输入/,
      );
      expect(await page.locator(".statement").innerText()).toMatch(
        /Output|输出/,
      );
      await expect(page.locator(".katex-error")).toHaveCount(0);
      await expect(page.locator(".sample").first()).toBeVisible();
    }
  }
});

test("dividers resize and persist; hiding code keeps drafts, Zen and the contest timer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");
  await page.getByRole("tab", { name: "2026 网络赛 I", exact: true }).click();
  await page.getByRole("button", { name: "开启虚拟比赛", exact: true }).click();
  await page.locator(".cm-content").fill("// retained 中文 draft");
  const sessions = await page.evaluate(() =>
    localStorage.getItem("testing-oj:v1:sessions"),
  );
  const middle = page.getByRole("separator", { name: "题面与代码分隔线" });
  const before = await size(page.locator(".statement-pane"), "width");
  await drag(page, middle, 130, 0);
  expect(await size(page.locator(".statement-pane"), "width")).toBeGreaterThan(
    before + 120,
  );
  const after = await size(page.locator(".statement-pane"), "width");
  await page.reload();
  expect(await size(page.locator(".statement-pane"), "width")).toBeCloseTo(
    after,
    0,
  );
  const editorBefore = await size(page.locator(".code-area"), "height");
  await drag(
    page,
    page.getByRole("separator", { name: "代码与测试分隔线" }),
    0,
    -100,
  );
  expect(await size(page.locator(".code-area"), "height")).toBeLessThan(
    editorBefore - 90,
  );
  await page.getByRole("button", { name: "自定义", exact: true }).click();
  const inputBefore = await size(
    page.getByLabel("标准输入", { exact: true }),
    "width",
  );
  await drag(
    page,
    page.getByRole("separator", { name: "输入与输出分隔线" }),
    60,
    0,
  );
  expect(
    await size(page.getByLabel("标准输入", { exact: true }), "width"),
  ).toBeGreaterThan(inputBefore + 50);
  await page.getByRole("button", { name: "关闭代码区", exact: true }).click();
  await expect(page.locator(".editor-pane")).toHaveCount(0);
  expect(await size(page.locator(".statement-pane"), "width")).toBeCloseTo(
    await size(page.locator(".workbench"), "width"),
    0,
  );
  await page.getByRole("button", { name: "题目 L", exact: true }).click();
  await expect(page.locator(".paper-heading h2")).toHaveText(
    "Longest Common Prefix",
  );
  await expect(page.locator(".app")).toHaveClass(/zen/);
  await page.reload();
  await expect(page.locator(".editor-pane")).toHaveCount(0);
  await page.getByRole("button", { name: "题目 A", exact: true }).click();
  await page.getByRole("button", { name: "打开代码区", exact: true }).click();
  await expect(page.locator(".cm-content")).toContainText(
    "// retained 中文 draft",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("testing-oj:v1:sessions")),
  ).toBe(sessions);
  await middle.focus();
  await page.keyboard.press("ArrowLeft");
  expect(Number(await middle.getAttribute("aria-valuenow"))).toBeLessThan(60);
  await middle.dblclick();
  expect(Number(await middle.getAttribute("aria-valuenow"))).toBe(50);
  await page.keyboard.press("Escape");
  const sidebarBefore = await size(page.locator(".explorer"), "width");
  await drag(page, page.getByRole("separator", { name: "侧栏宽度" }), 60, 0);
  expect(await size(page.locator(".explorer"), "width")).toBeGreaterThan(
    sidebarBefore + 55,
  );
  await page.screenshot({ path: "tmp/preview/workbench-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(middle).toHaveAttribute("aria-orientation", "horizontal");
  const height = await size(page.locator(".statement-pane"), "height");
  await drag(page, middle, 0, -60);
  expect(await size(page.locator(".statement-pane"), "height")).toBeLessThan(
    height - 55,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "tmp/preview/workbench-mobile.png",
    fullPage: true,
  });
});
