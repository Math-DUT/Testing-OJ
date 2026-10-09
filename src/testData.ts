import type { TestCase } from "./types";

// Only the current file is retained. Large cases never enter the JS bundle.
let cached: { file: string; test: TestCase } | undefined;
export async function loadTestCase(test: TestCase): Promise<TestCase> {
  if (!test.file) return test;
  if (cached?.file === test.file) return cached.test;
  const response = await fetch(`${import.meta.env.BASE_URL}${test.file}`);
  if (!response.ok) throw Error(`测试数据下载失败（${response.status}），请重试。`);
  const bytes = await response.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (x) => x.toString(16).padStart(2, "0")).join("");
  if (hash !== test.sha256) throw Error("测试数据校验失败，请刷新页面后重试。");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const data = JSON.parse(await new Response(stream).text());
  if (typeof data.input !== "string" || typeof data.output !== "string")
    throw Error("测试数据格式错误。");
  const loaded = { ...test, input: data.input, output: data.output };
  cached = { file: test.file, test: loaded };
  return loaded;
}

export function outputPreview(value: string): string {
  return value.length > 8192 ? value.slice(0, 8192) + "\n…（预览已截断，评测使用完整输出）" : value;
}
