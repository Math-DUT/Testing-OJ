import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("stress files load on demand, reject corruption, and can be stopped while loading", async ({ page }) => {
  const problems = JSON.parse(fs.readFileSync("src/problems.json", "utf8"));
  const first = problems.find((p: { id: string }) => p.id === "C").tests[0];
  let requested = 0;
  await page.route("**/test-data/**", async route => {
    requested++;
    await route.fulfill({ body: "corrupted", contentType: "application/octet-stream" });
  });
  await page.goto("/#problem/C");
  await expect(page.locator(".statement")).toBeVisible();
  expect(requested).toBe(0);
  await page.getByRole("button", { name: "提交自测", exact: true }).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText("ERROR");
  await expect(page.locator(".error-output")).toContainText("测试数据校验失败");
  expect(requested).toBe(1);
  await page.unroute("**/test-data/**");
  let release!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/test-data/**", async route => {
    await blocked;
    await route.fulfill({ body: fs.readFileSync("public/" + first.file), contentType: "application/octet-stream" });
  });
  await page.getByRole("button", { name: "提交自测", exact: true }).click();
  await page.getByRole("button", { name: "停止", exact: true }).click();
  release();
  await expect(page.getByRole("button", { name: "运行", exact: true })).toBeEnabled();
  await expect(page.locator(".test-results")).toHaveCount(0);
  await expect(page.locator(".cm-content")).toBeVisible();
});

test("real C++ handles the largest input and matrix output using complete worker checking", async ({ page }) => {
  const problems = JSON.parse(fs.readFileSync("src/problems.json", "utf8"));
  await page.goto("/#problem/C");
  for (const [id, source] of [
    ["M", `#include <bits/stdc++.h>
using namespace std; using ll=long long;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<pair<ll,ll>> a(n);for(auto&[x,y]:a)cin>>x>>y;
sort(a.begin(),a.end(),[](auto p,auto q){return pair(max(p.first,p.second),min(p.first,p.second))<pair(max(q.first,q.second),min(q.first,q.second));});
ll x=0;int ans=0;for(auto [c,b]:a)if(x<=c){x=max(x,b);ans++;}cout<<ans;}`],
    ["L", `#include <bits/stdc++.h>
using namespace std;int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int T;cin>>T;while(T--){int n;cin>>n;vector<int>a(n),b(n);for(int&x:a)cin>>x;for(int&x:b)cin>>x;for(int x:a){for(int y:b)cout<<min(x,y)-1<<' ';cout<<'\\n';}}}`],
  ]) {
    const problem = problems.find((p: { id: string }) => p.id === id);
    const meta = problem.tests[11];
    const result = await page.evaluate(async ({ meta, checker, source }) => {
      // Exercise the browser runtime and exact same loader/checker as a submission.
      const runner = await import("/src/runner.ts");
      const data = await import("/src/testData.ts");
      const judge = await import("/src/judge.ts");
      const loaded = await data.loadTestCase(meta);
      const answer = await runner.execute("cpp", source, loaded.input, () => {}, false, loaded.maxOutputBytes);
      const correct = answer.status === "OK" && await judge.judgeOutput(checker, loaded.input, answer.output, loaded.output);
      const preview = data.outputPreview(answer.output);
      runner.stopRunner();judge.stopJudge();
      return { status: answer.status, error: answer.error, correct, outputBytes: answer.output.length, preview, time: answer.time };
    }, { meta, checker: problem.checker, source });
    expect(result.status, result.error).toBe("OK");
    expect(result.correct).toBeTruthy();
    if (id === "M") expect(meta.inputBytes).toBeGreaterThan(2 * 1024 * 1024);
    if (id === "L") {
      expect(result.outputBytes).toBeGreaterThan(2 * 1024 * 1024);
      expect(result.preview.length).toBeLessThan(8300);
      expect(result.preview).toContain("评测使用完整输出");
    }
  }
  const cancelled = await page.evaluate(async () => {
    const runner = await import("/src/runner.ts");
    return await runner.execute("cpp", "int main(){while(true){asm volatile(\"\");}}", "", phase => {
      if (phase === "running") setTimeout(() => runner.stopRunner(), 100);
    });
  });
  expect(cancelled.status).toBe("CANCELLED");
});
