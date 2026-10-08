import type { Language, RunResult } from "./types";
import { codeLanguage, cppStandard } from "./languages";
import { executePyPy, stopLocalRunner } from "./localRunner";
let active: Worker | null = null;
let workerLanguage: string | null = null;
let cancelPending: (() => void) | null = null;
export function stopRunner() {
  stopLocalRunner();
  active?.terminate();
  active = null;
  workerLanguage = null;
  const cancel = cancelPending;
  cancelPending = null;
  cancel?.();
}
export function execute(
  language: Language,
  source: string,
  input: string,
  onPhase: (phase: string) => void,
  interactive = false,
): Promise<RunResult> {
  if (language === "pypy3") {
    active?.terminate();
    active = null;
    workerLanguage = null;
    onPhase("running");
    return executePyPy(source, input, interactive);
  }
  const family = codeLanguage(language);
  if (!active || workerLanguage !== family) {
    stopRunner();
    active = new Worker(
      new URL(
        `${import.meta.env.BASE_URL}runtime/${family === "cpp" ? "cpp-worker.js" : "python-worker.js"}`,
        location.href,
      ),
      { type: family === "python" ? "module" : "classic" },
    );
    workerLanguage = family;
  }
  const worker = active;
  return new Promise((resolve) => {
    let timeout: ReturnType<typeof setTimeout>;
    let phase = "loading";
    let finished = false;
    const finish = (result: RunResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cancelPending = null;
      worker.onmessage = null;
      worker.onerror = null;
      resolve(result);
    };
    cancelPending = () => finish({ status: "CANCELLED", output: "", time: 0 });
    const deadline = (ms: number) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        finish({
          status: phase === "running" ? "TLE" : "ERROR",
          output: "",
          error:
            phase === "running"
              ? "超过浏览器自测时限（10 秒）"
              : "运行环境加载或编译超时，请检查网络后重试。",
          time: phase === "running" ? 10000 : 0,
        });
        stopRunner();
      }, ms);
    };
    deadline(180000);
    worker.onmessage = (event) => {
      if (event.data.type === "phase") {
        phase = event.data.phase;
        onPhase(phase);
        deadline(phase === "running" ? 10000 : 180000);
      }
      if (event.data.type === "result") finish(event.data.result);
    };
    worker.onerror = (e) => {
      finish({
        status: "ERROR",
        output: "",
        error: e.message || "运行环境加载失败，请刷新后重试。",
        time: 0,
      });
      stopRunner();
    };
    worker.postMessage({
      source,
      input,
      interactive,
      standard: cppStandard(language),
    });
  });
}
