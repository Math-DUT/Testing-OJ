import { test, expect } from "@playwright/test";

test("contest tabs, saved fonts, automatic Zen and mobile layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("tab")).toHaveCount(3);
  await page.screenshot({ path: "tmp/preview/contests.png", fullPage: true });
  await page.getByRole("tab", { name: "2026 网络赛 I", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("14 道题");
  await page.getByRole("tab", { name: "2026 网络赛 II", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("12 道题");
  await page.getByRole("button", { name: "字体设置", exact: true }).click();
  for (const [label, value] of [
    ["界面", "20"],
    ["题面", "22"],
    ["代码", "21"],
  ]) {
    await page.getByLabel(label + "字体大小").fill(value);
  }
  await page.screenshot({ path: "tmp/preview/fonts.png", fullPage: true });
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.reload();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    ),
  ).toBe("20px");
  await page.getByRole("button", { name: "开启虚拟比赛", exact: true }).click();
  await expect(page.locator(".app")).toHaveClass(/zen/);
  await expect(page.locator(".topbar")).toBeHidden();
  await expect(page.locator(".statement")).toBeVisible();
  await page.getByRole("button", { name: "题目", exact: true }).click();
  await expect(page.locator(".problem-row")).toHaveCount(12);
  await page.getByRole("button", { name: "打开 L Loop", exact: true }).click();
  await expect(page.locator(".statement")).toBeVisible();
  expect(
    await page
      .locator(".statement")
      .evaluate((e) => getComputedStyle(e).fontSize),
  ).toBe("22px");
  expect(
    await page
      .locator(".cm-editor")
      .evaluate((e) => getComputedStyle(e).fontSize),
  ).toBe("21px");
  await expect(page.locator(".zen-timer")).toBeVisible();
  await page.screenshot({
    path: "tmp/preview/zen-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "字体设置", exact: true })
    .last()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator(".app")).toHaveClass(/zen/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "tmp/preview/zen-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    await page
      .locator(".statement")
      .evaluate((e) => getComputedStyle(e).fontSize),
  ).toBe("22px");
  await page.getByRole("button", { name: "退出禅模式", exact: true }).click();
  await expect(page.locator(".app")).not.toHaveClass(/zen/);
  await page.goto("/");
  await page.screenshot({
    path: "tmp/preview/contests-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  for (const [stage, ids] of [
    [1, "ABCDEFGHIJKLMN"],
    [2, "ABCDEFGHIJKL"],
  ] as const) {
    for (const id of ids + "*") {
      const response = await page.request.get(
        `/pdf/icpc-online-2026-${stage}/${id === "*" ? "problemset" : id}.pdf`,
      );
      expect(response.ok()).toBeTruthy();
      expect((await response.body()).subarray(0, 4).toString()).toBe("%PDF");
    }
  }
});

test("old records and drafts migrate; contest sessions and drafts stay separate", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("seeded")) return;
    localStorage.setItem("seeded", "1");
    const prefix = "testing-oj:v1:",
      start = Date.now() - 1000;
    localStorage.setItem(
      prefix + "session",
      JSON.stringify({ start, end: null }),
    );
    localStorage.setItem(prefix + "code:A:cpp", JSON.stringify("// old draft"));
    localStorage.setItem(
      prefix + "submissions",
      JSON.stringify([
        {
          id: "old",
          problem: "A",
          language: "cpp",
          source: "// old draft",
          at: start + 1,
          status: "PASS",
          passed: 1,
          total: 1,
          time: 1,
          contestStart: start,
          details: [],
        },
      ]),
    );
  });
  await page.goto("/#problem/A");
  await expect(page.locator(".cm-content")).toContainText("// old draft");
  await page.goto("/#submissions");
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.goto("/#contest/icpc-online-2026-1/submissions");
  await expect(page.locator(".history-row")).toHaveCount(0);
  await page.goto("/#contest/icpc-online-2026-1/problem/A");
  await expect(page.locator(".statement")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.locator(".cm-content").fill("// first contest draft");
  await page.goto("/#contest/icpc-online-2026-2/problem/A");
  await expect(page.locator(".cm-content")).not.toContainText(
    "// first contest draft",
  );
  await page.locator(".cm-content").fill("// second contest draft");
  await page.goto("/#contest/icpc-online-2026-1/problem/A");
  await expect(page.locator(".cm-content")).toContainText(
    "// first contest draft",
  );
  await page.goto("/");
  await page.getByRole("tab", { name: "2026 网络赛 I", exact: true }).click();
  await page.getByRole("button", { name: "开启虚拟比赛", exact: true }).click();
  const sessions = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("testing-oj:v1:sessions")!),
  );
  expect(Object.keys(sessions).sort()).toEqual([
    "icpc-online-2026-1",
    "lncpc-2025",
  ]);
  expect(sessions["lncpc-2025"].start).not.toBe(
    sessions["icpc-online-2026-1"].start,
  );
  await page.goto("/#contest/unknown");
  await expect(page.getByText("页面不存在", { exact: true })).toBeVisible();
});

// Adaptive exhaustive solver for small interactive instances. It knows only n
// and judge replies, and chooses a query that best partitions remaining paths.
const pythonSolver = `import sys, itertools
read = sys.stdin.buffer.readline
def reply(p, m, v):
    b = [((x & m).bit_count() % 2) ^ (x == v) for x in p]
    return sum(x != y for x, y in zip(b, b[1:])) % 3
for _ in range(int(read())):
    n = int(read()); k = (n-1).bit_length()
    paths = [p for p in itertools.permutations(range(n)) if n == 1 or p[0] < p[-1]]
    while len(paths) > 1:
        best = None; score = -1
        for m in range(1 << k):
            for v in range(-1, n):
                buckets = [0, 0, 0]
                for p in paths: buckets[reply(p, m, v)] += 1
                s = len(paths) - max(buckets)
                if s > score: score = s; best = (m, v)
        m, v = best
        print('?', m, v, flush=True)
        answer = int(read())
        paths = [p for p in paths if reply(p, m, v) == answer]
    print('!', *paths[0], flush=True)
`;
const cppSolver = `#include <bits/stdc++.h>
using namespace std;
int reply(const vector<int>& p,int m,int v){int c=0;for(int i=1;i<(int)p.size();i++){int a=(__builtin_popcount(p[i-1]&m)&1)^(p[i-1]==v),b=(__builtin_popcount(p[i]&m)&1)^(p[i]==v);c+=a!=b;}return c%3;}
int main(){int T;cin>>T;cerr<<"debug on stderr\\n";while(T--){int n;cin>>n;int k=0;while((1<<k)<n)k++;vector<int> p(n);iota(p.begin(),p.end(),0);vector<vector<int>> paths;do{if(n==1||p[0]<p.back())paths.push_back(p);}while(next_permutation(p.begin(),p.end()));while(paths.size()>1){int bm=0,bv=-1,score=-1;for(int m=0;m<(1<<k);m++)for(int v=-1;v<n;v++){int b[3]={};for(auto&q:paths)b[reply(q,m,v)]++;int s=paths.size()-*max_element(b,b+3);if(s>score){score=s;bm=m;bv=v;}}cout<<"? "<<bm<<" "<<bv<<endl;int a;cin>>a;vector<vector<int>> keep;for(auto&q:paths)if(reply(q,bm,bv)==a)keep.push_back(q);paths=keep;}cout<<"!";for(int x:paths[0])cout<<" "<<x;cout<<endl;}}
`;

test("C++ and Python interact with the real local judge and reject wrong answers", async ({
  page,
}) => {
  await page.goto("/#contest/icpc-online-2026-2/problem/H");
  await page.getByRole("button", { name: "自定义", exact: true }).click();
  await page
    .getByLabel("标准输入", { exact: true })
    .fill("3\n1\n0\n3\n1 0 2\n4\n1 3 0 2\n");
  for (const [language, source] of [
    ["cpp", cppSolver],
    ["python", pythonSolver],
  ] as const) {
    await page.getByLabel("语言").selectOption(language);
    // Switching language restores default input; reload the chosen scenario.
    await page
      .getByLabel("标准输入", { exact: true })
      .fill("3\n1\n0\n3\n1 0 2\n4\n1 3 0 2\n");
    await page.locator(".cm-content").fill(source);
    await page.getByRole("button", { name: "运行", exact: true }).click();
    await expect(page.locator(".test-results")).toBeVisible({ timeout: 180000 });
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(1, {
      timeout: 5000,
    });
    await expect(page.locator(".test-results pre").first()).toContainText("?");
  }
  await page.getByRole("button", { name: "自定义", exact: true }).click();
  await page.getByLabel("标准输入", { exact: true }).fill("1\n3\n1 0 2\n");
  await page.locator(".cm-content").fill("print('! 0 1 2')");
  await page.getByRole("button", { name: "运行", exact: true }).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText(
    /WA/,
  );
  await expect(page.locator(".error-output")).toContainText("隐藏排列重建错误");
});
