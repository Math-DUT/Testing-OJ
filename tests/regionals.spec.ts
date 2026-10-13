import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
const subsetCpp = `#include <bits/stdc++.h>
using namespace std;int main(){int n;cin>>n;vector<int>a(1<<n);for(int&x:a)cin>>x;int ans=0;
for(int q=0,Q=pow(3,n);q<Q;q++){int code=q,mask=0,value=0;for(int b=0;b<n;b++){int digit=code%3;code/=3;if(digit<2){mask|=1<<b;if(digit)value|=1<<b;}}
int sum=0;for(int j=0;j<(1<<n);j++)if((j&mask)==value)sum+=a[j];ans^=sum;}cout<<ans;}`;
const subsetPython = `n=int(input());a=list(map(int,input().split()));answer=0
for q in range(3**n):
    mask=value=0
    for b in range(n):
        digit=q%3;q//=3
        if digit<2:
            mask|=1<<b
            if digit:value|=1<<b
    answer^=sum(x for j,x in enumerate(a) if (j&mask)==value)
print(answer)`;
// For a path rooted at 1, distance(1,X)=X-1; ball queries binary-search X.
const menjiCpp = `#include <bits/stdc++.h>
using namespace std;int main(){int T;cin>>T;while(T--){int n;cin>>n;for(int i=1,x;i<n;i++)cin>>x;
int l=1,r=n;while(l<r){int mid=(l+r)/2;cout<<"? 1 "<<mid-1<<endl;int yes;cin>>yes;if(yes)r=mid;else l=mid+1;}cout<<"! "<<l<<endl;}}`;
const menjiPython = `import sys
T=int(input())
for _ in range(T):
    n=int(input());parents=input();l=1;r=n
    while l<r:
        mid=(l+r)//2;print('?',1,mid-1,flush=True)
        if int(input()):r=mid
        else:l=mid+1
    print('!',l,flush=True)`;
const communicationCpp = `#include <bits/stdc++.h>
using namespace std;int main(){int op,n,m;cin>>op>>n>>m;while(n--){if(op==1){int x;cin>>x;
for(int j=0;j<3*m;j++)cout<<(x==1?j/3+1:j%m+1)<<' ';cout<<'\\n';}
else{vector<int>a(3*m);for(int&x:a)cin>>x;cout<<(a[0]==a[1]&&a[1]==a[2]?1:2)<<'\\n';}}}`;

test("both regionals have separate virtual contests, native statements, samples and PDF downloads", async ({page}) => {
  await page.goto("/");await expect(page.getByRole("tab")).toHaveCount(5);
  for (const [city,label] of [["shenyang","2025 沈阳站"],["shanghai","2025 上海站"]]) {
    await page.goto("/");await page.getByRole("tab",{name:label,exact:true}).click();
    await expect(page.getByRole("tabpanel")).toContainText("13 道题");
    const response=await page.request.get(`/pdf/icpc-${city}-2025/problemset.pdf`);
    expect(response.ok()).toBeTruthy();expect((await response.body()).subarray(0,4).toString()).toBe("%PDF");
    await page.getByRole("button",{name:"开启虚拟比赛",exact:true}).click();
    await expect(page.locator(".app")).toHaveClass(/zen/);
    await page.getByRole("button",{name:"题目 M",exact:true}).click();
    await expect(page.locator(".paper-heading small")).toHaveText("Problem M");
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.reload();await expect(page.locator(".zen-timer")).toBeVisible();
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({width:390,height:844});await page.goto("/");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:"tmp/preview/five-contests-mobile.png",fullPage:true});
});

test("new sample tests compile and execute in C++23 and Python", async ({page}) => {
  await page.goto("/#contest/icpc-shanghai-2025/problem/D");
  for (const [language,source] of [["cpp23",subsetCpp],["python",subsetPython]]) {
    await page.getByLabel("语言").selectOption(language);await page.locator(".cm-content").fill(source);
    await page.getByRole("button",{name:"提交自测",exact:true}).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(2,{timeout:180000});
    await expect(page.locator(".status-scope")).toContainText("公开样例");
  }
});

test("adaptive Menji works in C++ and Python; wrong answers are rejected; communication uses two fresh runs", async ({page}) => {
  await page.goto("/#contest/icpc-shanghai-2025/problem/A");
  const scenario="2\n5\n1 2 3 4\n0\n7\n1 2 3 4 5 6\n7\n";
  for (const [language,source] of [["cpp",menjiCpp],["python",menjiPython]]) {
    await page.getByLabel("语言").selectOption(language);await page.getByRole("button",{name:"自定义",exact:true}).click();
    await page.getByLabel("标准输入",{exact:true}).fill(scenario);await page.locator(".cm-content").fill(source);
    await page.getByRole("button",{name:"运行",exact:true}).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(1,{timeout:180000});
  }
  await page.getByRole("button",{name:"自定义",exact:true}).click();
  await page.getByLabel("标准输入",{exact:true}).fill("1\n5\n1 2 3 4\n0\n");
  await page.locator(".cm-content").fill("print('! 1',flush=True)");
  await page.getByRole("button",{name:"运行",exact:true}).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText("WA",{timeout:30000});
  await expect(page.locator(".error-output")).toContainText("尚未唯一确定");
  await page.goto("/#contest/icpc-shenyang-2025/problem/C");
  await page.getByLabel("语言").selectOption("cpp");
  await page.getByRole("button",{name:"自定义",exact:true}).click();
  await page.getByLabel("标准输入",{exact:true}).fill("1 3 2\n1\n2\n1\n");
  await page.locator(".cm-content").fill(communicationCpp);
  await page.getByRole("button",{name:"运行",exact:true}).click();
  await expect(page.locator(".test-results .verdict.pass")).toHaveCount(1,{timeout:180000});
  await expect(page.locator(".test-results pre").first()).toContainText("乱序恢复正确");
  await page.getByRole("button",{name:"自定义",exact:true}).click();
  await page.locator(".cm-content").fill("#include <iostream>\nint main(){std::cout<<1;}");
  await page.getByRole("button",{name:"运行",exact:true}).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText("WA",{timeout:180000});
});

test("real PyPy3 supports the new adaptive protocol", async ({page}) => {
  test.skip(!process.env.PYPY_BIN,"PYPY_BIN required");let child:ChildProcess|undefined;
  try {
    child=spawn(process.env.PYPY_BIN!,["public/local/testing_oj_runner.py","--no-browser"],{stdio:["ignore","pipe","pipe"]});
    const token=await new Promise<string>((resolve,reject)=>{
      let text="";const timer=setTimeout(()=>reject(Error("Helper did not start")),10000);
      child!.on("exit",()=>{clearTimeout(timer);reject(Error("Helper exited"));});
      child!.stdout!.on("data",chunk=>{text+=chunk.toString();const match=text.match(/local-runner=([a-zA-Z0-9_-]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
    });
    await page.goto(`/?local-runner=${token}#contest/icpc-shanghai-2025/problem/A`);
    await page.getByLabel("语言").selectOption("pypy3");await page.getByRole("button",{name:"自定义",exact:true}).click();
    await page.getByLabel("标准输入",{exact:true}).fill("1\n7\n1 2 3 4 5 6\n0\n");
    await page.locator(".cm-content").fill(menjiPython);await page.getByRole("button",{name:"运行",exact:true}).click();
    await expect(page.locator(".test-results .verdict.pass")).toHaveCount(1,{timeout:30000});
  } finally {child?.kill();}
});

test("Python works with external CDNs blocked; invalid interactive data is reported as ERROR", async ({page}) => {
  await page.context().route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
  await page.goto("/#problem/C");await page.getByLabel("语言").selectOption("python");
  await page.locator(".cm-content").fill("a,b=input().split()\nprint(int(int(a[:-1])<=int(b[:-1])))");
  await page.getByRole("button",{name:"提交自测",exact:true}).click();
  await expect(page.locator(".test-results .verdict.pass")).toHaveCount(15,{timeout:60000});
  await page.goto("/#contest/icpc-shanghai-2025/problem/A");
  await page.getByLabel("语言").selectOption("cpp");await page.getByRole("button",{name:"自定义",exact:true}).click();
  await page.getByLabel("标准输入",{exact:true}).fill("1\n4\n1 1 1\n0\n");
  await page.locator(".cm-content").fill(menjiCpp);await page.getByRole("button",{name:"运行",exact:true}).click();
  await expect(page.locator(".test-results .verdict.fail").first()).toHaveText("ERROR",{timeout:180000});
  await expect(page.locator(".error-output")).toContainText("二叉树");
});
