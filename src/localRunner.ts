import type { RunResult } from "./types";
const API = "http://127.0.0.1:27121";
const KEY = "testing-oj:v1:local-runner-token";
export function acceptLocalRunnerLink() {
  const url = new URL(location.href),
    token = url.searchParams.get("local-runner");
  if (token && /^[a-zA-Z0-9_-]{32,128}$/.test(token)) {
    localStorage.setItem(KEY, token);
    url.searchParams.delete("local-runner");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
}
const headers = () => ({
  Authorization: `Bearer ${localStorage.getItem(KEY) || ""}`,
  "Content-Type": "application/json",
});
export async function localRunnerHealth(): Promise<string | null> {
  if (!localStorage.getItem(KEY)) return null;
  try {
    const response = await fetch(API + "/health", {
      headers: headers(),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.pypy3 ? data.version : null;
  } catch {
    return null;
  }
}
let controller: AbortController | null = null;
let runId: string | null = null;
export function stopLocalRunner() {
  controller?.abort();
  controller = null;
  if (runId)
    void fetch(API + "/cancel", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ id: runId }),
      keepalive: true,
    }).catch(() => {});
  runId = null;
}
export async function executePyPy(
  source: string,
  input: string,
  interactive: boolean,
): Promise<RunResult> {
  controller = new AbortController();
  const current = controller;
  const id = crypto.randomUUID();
  runId = id;
  const timeout = setTimeout(() => current.abort(), 15000);
  try {
    const response = await fetch(API + "/run", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ source, input, interactive, id }),
      signal: current.signal,
    });
    if (!response.ok) throw Error(`本机助手连接失败（${response.status}）`);
    return await response.json();
  } catch (e) {
    return {
      status: current.signal.aborted ? "CANCELLED" : "ERROR",
      output: "",
      error:
        "请启动 PyPy3 本机助手，并使用助手打开的网站连接。" +
        (e instanceof Error ? `\n${e.message}` : ""),
      time: 0,
    };
  } finally {
    clearTimeout(timeout);
    if (controller === current) {
      controller = null;
      runId = null;
    }
  }
}
