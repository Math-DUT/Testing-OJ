import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import {
  BookOpen,
  Trophy,
  History,
  Settings,
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  Download,
  Play,
  Check,
  X,
  Terminal,
  Code2,
  Github,
  Sun,
  Moon,
  ArrowLeft,
  Upload,
  Square,
  Clock,
  PanelLeftClose,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { contests, DEFAULT_CONTEST, parseRoute, problemPdf } from "./contests";
import type {
  Language,
  Submission,
  Session,
  RunResult,
  FontSettings,
} from "./types";
import { execute, stopRunner } from "./runner";
import { checkOutput } from "./checkers";

const KEY = "testing-oj:v1:";
const defaultFonts: FontSettings = { ui: 16, statement: 17, code: 16 };
const fontLimits = { ui: [14, 20], statement: [14, 26], code: [12, 26] };
function cleanFonts(value: Partial<FontSettings>): FontSettings {
  return Object.fromEntries(
    Object.entries(defaultFonts).map(([key, fallback]) => {
      const k = key as keyof FontSettings,
        n = Number(value?.[k]);
      return [
        k,
        Number.isFinite(n)
          ? Math.max(fontLimits[k][0], Math.min(fontLimits[k][1], n))
          : fallback,
      ];
    }),
  ) as unknown as FontSettings;
}
function migrateRecords(records: Submission[]): Submission[] {
  return records.map((s) => ({
    ...s,
    contestId: s.contestId || DEFAULT_CONTEST,
  }));
}
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(KEY + key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(KEY + key, JSON.stringify(value));
  } catch {
    /* Show a persistent notice when browser storage is unavailable. */
  }
}
function download(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const template: Record<Language, string> = {
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // Write your solution here.\n\n    return 0;\n}\n",
  python:
    'import sys\n\n\ndef solve():\n    # Write your solution here.\n    pass\n\n\nif __name__ == "__main__":\n    solve()\n',
};
const formatTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((x) => String(x).padStart(2, "0"))
    .join(":");
};
const codeTheme = EditorView.theme({
  "&": {
    fontSize: "var(--code-font-size, 16px)",
    height: "100%",
    backgroundColor: "var(--editor)",
    color: "var(--text)",
  },
  ".cm-content": {
    fontFamily: "JetBrains Mono, monospace",
    padding: "18px 0",
    caretColor: "#b5a4ff",
  },
  ".cm-gutters": {
    backgroundColor: "var(--editor)",
    color: "#71757d",
    border: "none",
    paddingRight: "12px",
  },
  ".cm-activeLine": { backgroundColor: "#8888880b" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#aaa" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-focused": { outline: "none" },
});
const phaseText: Record<string, string> = {
  loading: "加载运行环境…",
  compiling: "编译中…",
  running: "运行中…",
};

export default function App() {
  const [path, setPath] = useState(location.hash);
  const [selectedContest, setSelectedContest] = useState(
    read("selected-contest", DEFAULT_CONTEST),
  );
  const parsed = parseRoute(path);
  const route = parsed.view;
  const contest =
    contests.find((c) => c.id === (parsed.contestId || selectedContest)) ||
    contests[0];
  const problems = contest.problems;
  const HOURS = contest.duration;
  const [language, setLanguage] = useState<Language>(read("language", "cpp"));
  const [submissions, setSubmissions] = useState<Submission[]>(
    migrateRecords(read("submissions", [])),
  );
  const [sessions, setSessions] = useState<Record<string, Session | null>>(
    read("sessions", { [DEFAULT_CONTEST]: read("session", null) }),
  );
  const session = sessions[contest.id] || null;
  const setSession = (value: Session | null) =>
    setSessions((s) => ({ ...s, [contest.id]: value }));
  const [fonts, setFonts] = useState<FontSettings>(() =>
    cleanFonts(read("fonts", defaultFonts)),
  );
  const [profile, setProfile] = useState<string>(read("profile", "Math-DUT"));
  const [theme, setTheme] = useState(read("theme", "dark"));
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(Date.now());
  const [settings, setSettings] = useState(false);
  const [toast, setToast] = useState("");
  const [detail, setDetail] = useState<Submission | null>(null);
  const [code, setCode] = useState("");
  const [view, setView] = useState("statement");
  const [input, setInput] = useState("");
  const [expected, setExpected] = useState("");
  const [testMode, setTestMode] = useState<"samples" | "custom">("samples");
  const [result, setResult] = useState<RunResult[] | null>(null);
  const [busy, setBusy] = useState("");
  const [testProgress, setTestProgress] = useState({ current: 0, total: 0 });
  const [collapsed, setCollapsed] = useState(false);
  const [zen, setZen] = useState(read("zen", false));
  const upload = useRef<HTMLInputElement>(null);
  const runRef = useRef<(submit: boolean) => void>(() => {});
  const problem = problems.find((p) => route === `problem/${p.id}`);
  const history = submissions.filter((s) => s.contestId === contest.id);
  const draftKey = (id: string, lang: Language, cid = contest.id) =>
    `code:${cid}:${id}:${lang}`;
  const readCode = (id: string, lang: Language) =>
    read(
      draftKey(id, lang),
      contest.id === DEFAULT_CONTEST
        ? read(`code:${id}:${lang}`, template[lang])
        : template[lang],
    );
  const remaining = session
    ? Math.max(0, (session.end ?? session.start + HOURS) - now)
    : HOURS;
  const contestActive = !!session && !session.end && remaining > 0;
  const passed = new Set(
    history.filter((s) => s.status === "PASS").map((s) => s.problem),
  );
  const contestSubmissions = history.filter(
    (s) =>
      session &&
      s.contestStart === session.start &&
      s.at <= session.start + HOURS &&
      (session.end === null || s.at <= session.end),
  );
  const contestPassed = new Set(
    contestSubmissions.filter((s) => s.status === "PASS").map((s) => s.problem),
  );
  const nav = (view: string, id = contest.id) => {
    location.hash =
      view === "contests"
        ? "contests"
        : `contest/${id}${view === "problems" ? "" : "/" + view}`;
  };
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 5000);
  };
  useEffect(() => {
    const handler = () => {
      stopRunner();
      setBusy("");
      setPath(location.hash);
      setResult(null);
      setView("statement");
    };
    window.addEventListener("hashchange", handler);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.removeEventListener("hashchange", handler);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (parsed.contestId && contests.some((c) => c.id === parsed.contestId)) {
      setSelectedContest(parsed.contestId);
    }
    setQuery("");
  }, [parsed.contestId]);
  useEffect(() => save("selected-contest", selectedContest), [selectedContest]);
  useEffect(() => save("zen", zen), [zen]);
  useEffect(() => {
    if (problem) {
      setView(problem.statementFormat === "pdf" ? "pdf" : "statement");
      save(`last-problem:${contest.id}`, problem.id);
    }
  }, [contest.id, problem?.id]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (settings) setSettings(false);
      else if (detail) setDetail(null);
      else setZen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [settings, detail]);
  useEffect(() => {
    document.documentElement.style.fontSize = `${fonts.ui}px`;
    document.documentElement.style.setProperty(
      "--statement-font-size",
      `${fonts.statement}px`,
    );
    document.documentElement.style.setProperty(
      "--code-font-size",
      `${fonts.code}px`,
    );
    save("fonts", fonts);
  }, [fonts]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save("theme", theme);
  }, [theme]);
  useEffect(() => {
    save("submissions", submissions);
  }, [submissions]);
  useEffect(() => {
    save("sessions", sessions);
  }, [sessions]);
  useEffect(() => {
    save("profile", profile);
  }, [profile]);
  useEffect(() => {
    save("language", language);
    if (problem) {
      setCode(readCode(problem.id, language));
      setInput(
        (problem.checker === "hidden-track"
          ? problem.tests?.[0]
          : problem.samples[0]
        )?.input || "",
      );
      setExpected(
        problem.checker === "hidden-track"
          ? ""
          : problem.samples[0]?.output || "",
      );
      setResult(null);
    }
  }, [contest.id, problem?.id, language]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && problem) {
        e.preventDefault();
        runRef.current(e.shiftKey);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [problem]);
  useEffect(() => {
    try {
      const test = KEY + "storage-check";
      localStorage.setItem(test, "1");
      localStorage.removeItem(test);
    } catch {
      notify("浏览器存储不可用，请导出记录以免丢失。");
    }
  }, []);
  const startContest = () => {
    setZen(true);
    setSession({ start: Date.now(), end: null });
    notify(`${contest.shortTitle} · 虚拟比赛已开始`);
    nav(`problem/${problems[0].id}`);
  };
  const endContest = () => {
    if (session) setSession({ ...session, end: Date.now() });
    notify("比赛已结束，记录已保存。");
  };
  const run = async (submit: boolean) => {
    if (!problem || busy) return;
    const tests =
      testMode === "samples"
        ? problem.tests || problem.samples
        : [{ input, output: expected }];
    if (submit && testMode === "custom") {
      notify("提交自测使用全部测试点；自定义输入请使用运行。");
      return;
    }
    setResult(null);
    setBusy("loading");
    setTestProgress({ current: 0, total: tests.length });
    const results: RunResult[] = [];
    const startedAt = Date.now(),
      contestStart = contestActive ? session!.start : null;
    try {
      for (const test of tests) {
        setTestProgress({ current: results.length + 1, total: tests.length });
        const answer = await execute(
          language,
          code,
          test.input,
          setBusy,
          problem.checker === "hidden-track",
        );
        if (answer.status === "CANCELLED") return;
        if (answer.status === "OK")
          answer.status =
            testMode === "custom" && !test.output.trim()
              ? "RUN"
              : checkOutput(
                    problem.checker,
                    test.input,
                    answer.output,
                    test.output,
                  )
                ? "PASS"
                : "WA";
        results.push(answer);
        if (["CE", "RE", "TLE", "OLE", "ERROR"].includes(answer.status)) {
          while (results.length < tests.length)
            results.push({
              status: "SKIP",
              output: "",
              time: 0,
              error: "前面的测试发生运行错误，后续测试未执行。",
            });
          break;
        }
      }
      setResult(results);
      if (submit) {
        const passedCount = results.filter((x) => x.status === "PASS").length;
        const status =
          results.find((x) => x.status !== "PASS")?.status ?? "PASS";
        const record: Submission = {
          id: crypto.randomUUID(),
          contestId: contest.id,
          problem: problem.id,
          language,
          source: code,
          at: startedAt,
          status,
          passed: passedCount,
          total: tests.length,
          time: Math.max(...results.map((x) => x.time)),
          contestStart,
          details: results,
        };
        setSubmissions((previous) => [record, ...previous].slice(0, 500));
        notify(
          status === "PASS"
            ? "全部自测点通过，已保存记录。"
            : "自测记录已保存。",
        );
      }
    } finally {
      setBusy("");
    }
  };
  runRef.current = run;
  const score = (id: string) => {
    const list = [...contestSubmissions]
        .reverse()
        .filter((s) => s.problem === id),
      first = list.findIndex((s) => s.status === "PASS");
    if (first < 0)
      return { solved: false, attempts: list.length, penalty: 0, minute: 0 };
    const minute = Math.floor((list[first].at - session!.start) / 60000),
      wrong = list
        .slice(0, first)
        .filter((s) => !["CE", "ERROR"].includes(s.status)).length;
    return {
      solved: true,
      attempts: wrong + 1,
      penalty: minute + wrong * 20,
      minute,
    };
  };
  const totalPenalty = problems.reduce(
    (sum, p) => sum + score(p.id).penalty,
    0,
  );
  const backup = () =>
    download(
      "testing-oj-backup.json",
      JSON.stringify(
        {
          version: 2,
          profile,
          sessions,
          fonts,
          submissions,
          codes: Object.fromEntries(
            Object.keys(localStorage)
              .filter((k) => k.startsWith(KEY + "code:"))
              .map((k) => [k, localStorage.getItem(k)]),
          ),
        },
        null,
        2,
      ),
    );
  const restore = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (
        ![1, 2].includes(data.version) ||
        !Array.isArray(data.submissions) ||
        data.submissions.length > 500 ||
        typeof data.profile !== "string"
      )
        throw Error();
      const records = migrateRecords(data.submissions as Submission[]);
      if (
        records.some(
          (s) =>
            !contests.some(
              (c) =>
                c.id === s.contestId &&
                c.problems.some((p) => p.id === s.problem),
            ) ||
            !["cpp", "python"].includes(s.language) ||
            typeof s.source !== "string" ||
            !Number.isFinite(s.at) ||
            !Array.isArray(s.details),
        )
      )
        throw Error();
      const importedSessions =
        data.version === 1
          ? { [DEFAULT_CONTEST]: data.session ?? null }
          : (data.sessions ?? {});
      if (
        Object.entries(importedSessions).some(([id, value]) => {
          const s = value as Session | null;
          return (
            !contests.some((c) => c.id === id) ||
            (s &&
              (!Number.isFinite(s.start) ||
                !(s.end === null || Number.isFinite(s.end))))
          );
        })
      )
        throw Error();
      setProfile(data.profile.slice(0, 32));
      setSubmissions(records);
      setSessions(importedSessions);
      if (data.fonts) setFonts(cleanFonts(data.fonts));
      for (const [key, value] of Object.entries(data.codes ?? {})) {
        if (
          /^testing-oj:v1:code:(?:(lncpc-2025|icpc-online-2026-[12]):)?[A-N]:(cpp|python)$/.test(
            key,
          ) &&
          typeof value === "string"
        )
          localStorage.setItem(key, value);
      }
      if (problem) setCode(readCode(problem.id, language));
      notify("本地记录已导入。");
    } catch {
      notify("备份文件格式不正确。");
    }
    if (upload.current) upload.current.value = "";
  };
  const badge = (status: string) => (
    <span
      className={`verdict ${status === "PASS" ? "pass" : ["RUN", "SKIP"].includes(status) ? "neutral" : "fail"}`}
    >
      {status === "PASS" ? (
        <Check size={13} />
      ) : ["RUN", "SKIP"].includes(status) ? (
        <Terminal size={13} />
      ) : (
        <X size={13} />
      )}{" "}
      {status === "PASS"
        ? "Passed"
        : status === "RUN"
          ? "Executed"
          : status === "SKIP"
            ? "Skipped"
            : status}
    </span>
  );
  const timerCard = (
    <div className="timer-card">
      <div className="card-label">
        <Clock size={15} />
        虚拟比赛
        <span className={`pill ${contestActive ? "live" : ""}`}>
          {contestActive ? "进行中" : session ? "已结束" : "未开始"}
        </span>
      </div>
      <div className="timer">{formatTime(remaining)}</div>
      <div className="timer-progress">
        <i style={{ width: `${(remaining / HOURS) * 100}%` }} />
      </div>
      <div className="timer-meta">
        <span>ICPC · 5 小时</span>
        <span>罚时 20 分钟</span>
      </div>
      {contestActive ? (
        <button className="button quiet full" onClick={endContest}>
          <Square size={13} />
          结束比赛
        </button>
      ) : (
        <button className="button primary full" onClick={startContest}>
          <Play size={15} />
          {session ? "开启新比赛" : "开始虚拟比赛"}
        </button>
      )}
    </div>
  );
  return (
    <div
      className={`app ${route === "contests" ? "hub-layout" : ""} ${collapsed ? "collapsed" : ""} ${zen && route !== "contests" ? "zen" : ""}`}
    >
      <aside className="activity">
        <button
          className="brand"
          onClick={() => nav("contests")}
          title="Testing OJ"
        >
          <Code2 size={27} />
        </button>
        <div className="activity-top">
          {[
            { path: "contests", icon: Trophy, label: "比赛" },
            { path: "problems", icon: BookOpen, label: "题目" },
            { path: "submissions", icon: History, label: "提交记录" },
            { path: "standings", icon: Trophy, label: "自测榜" },
          ].map((item) => (
            <button
              key={item.path}
              className={
                route === item.path || (item.path === "problems" && problem)
                  ? "selected"
                  : ""
              }
              title={item.label}
              aria-label={item.label}
              onClick={() => nav(item.path)}
            >
              <item.icon size={22} />
            </button>
          ))}
        </div>
        <div className="activity-bottom">
          <a
            href="https://github.com/Math-DUT/Testing-OJ"
            target="_blank"
            rel="noreferrer"
            title="GitHub 仓库"
          >
            <Github size={21} />
          </a>
          <button
            title="切换主题"
            aria-label="切换主题"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
          </button>
          <button
            title="设置"
            aria-label="设置"
            onClick={() => setSettings(true)}
          >
            <Settings size={21} />
          </button>
          <button
            className="avatar"
            onClick={() => setSettings(true)}
            title="本地选手设置"
          >
            {profile.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </aside>
      <aside className="explorer">
        <div className="explorer-heading">
          工作区
          <button
            title="收起侧栏"
            aria-label="收起侧栏"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
        <div className="workspace-name">
          <span className="workspace-icon">
            <Code2 size={19} />
          </span>
          <div>
            Testing OJ<small>本地自测工作区</small>
          </div>
        </div>
        <button className="tree-heading" onClick={() => nav("problems")}>
          <ChevronDown size={14} />
          <Trophy size={15} />
          {contest.shortTitle}
          <span>{problems.length}</span>
        </button>
        <div className="tree-problems">
          {route === "contests"
            ? contests.map((c) => (
                <button
                  key={c.id}
                  className={c.id === contest.id ? "active" : ""}
                  onClick={() => setSelectedContest(c.id)}
                >
                  <Trophy size={15} />
                  <span>{c.shortTitle}</span>
                </button>
              ))
            : problems.map((p) => (
                <button
                  key={p.id}
                  className={problem?.id === p.id ? "active" : ""}
                  onClick={() => nav(`problem/${p.id}`)}
                >
                  <span className="file-id">{p.id}</span>
                  <span>{p.title}</span>
                  {passed.has(p.id) && <Check size={13} className="green" />}
                </button>
              ))}
        </div>
        <div className="explorer-footer">
          <span className="connection-dot" />
          浏览器本地运行<span className="mono">WASM</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            {collapsed && (
              <button aria-label="展开侧栏" onClick={() => setCollapsed(false)}>
                <BookOpen size={18} />
              </button>
            )}
            <span>Testing OJ</span>
            <ChevronRight size={13} />
            <button className="breadcrumb-link" onClick={() => nav("contests")}>
              比赛
            </button>
            <ChevronRight size={13} />
            <strong>{contest.shortTitle}</strong>
            {problem && (
              <>
                <ChevronRight size={13} />
                <span>{problem.id}</span>
              </>
            )}
          </div>
          <span className="topbar-right">
            <button
              className="font-settings-button"
              aria-label="字体设置"
              title="字体设置"
              onClick={() => setSettings(true)}
            >
              Aa
            </button>
            <span className="local-tag">LOCAL</span>
            <span>{profile}</span>
          </span>
        </header>
        <div className="tabs">
          <button
            className={route === "contests" ? "tab active" : "tab"}
            onClick={() => nav("contests")}
          >
            <Trophy size={15} />
            比赛
          </button>
          {route !== "contests" && (
            <>
              <button
                className={
                  !problem && route === "problems" ? "tab active" : "tab"
                }
                onClick={() => nav("problems")}
              >
                <Trophy size={15} />
                比赛题目
              </button>
              {problem && (
                <button className="tab active">
                  <FileText size={15} />
                  {problem.id}. {problem.title}
                </button>
              )}
              <button
                className={route === "submissions" ? "tab active" : "tab"}
                onClick={() => nav("submissions")}
              >
                <History size={15} />
                提交记录<span className="tab-count">{history.length}</span>
              </button>
              <button
                className={route === "standings" ? "tab active" : "tab"}
                onClick={() => nav("standings")}
              >
                <Trophy size={15} />
                自测榜
              </button>
            </>
          )}
          <div className="tabs-end">
            {contestActive && (
              <span className="mini-timer">
                <Clock size={13} />
                {formatTime(remaining)}
              </span>
            )}
          </div>
        </div>
        <main className={problem ? "problem-main" : "overview-main"}>
          {route === "contests" && (
            <section className="contest-hub">
              <div className="hub-heading">
                <h1>比赛</h1>
                <span className="muted">虚拟自测</span>
              </div>
              <div
                className="contest-switcher"
                role="tablist"
                aria-label="选择比赛"
              >
                {contests.map((c) => (
                  <button
                    key={c.id}
                    id={`tab-${c.id}`}
                    role="tab"
                    aria-selected={c.id === contest.id}
                    aria-controls={`panel-${contest.id}`}
                    className={c.id === contest.id ? "selected" : ""}
                    onClick={() => setSelectedContest(c.id)}
                  >
                    {c.shortTitle}
                  </button>
                ))}
              </div>
              <div
                className="contest-preview"
                id={`panel-${contest.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${contest.id}`}
              >
                <div className="eyebrow">ICPC · {contest.date.slice(0, 4)}</div>
                <h2>{contest.title}</h2>
                <p className="contest-english">{contest.englishTitle}</p>
                <div className="contest-facts">
                  <span>
                    <Clock size={16} />5 小时
                  </span>
                  <span>
                    <BookOpen size={16} />
                    {problems.length} 道题
                  </span>
                  <span>{contest.date.replaceAll("-", ".")}</span>
                  {contestActive && (
                    <span className="live-text">
                      进行中 · {formatTime(remaining)}
                    </span>
                  )}
                </div>
                <div className="contest-actions">
                  <button
                    className="button primary"
                    onClick={
                      contestActive
                        ? () => {
                            setZen(true);
                            const last = read(
                              `last-problem:${contest.id}`,
                              problems[0].id,
                            );
                            nav(
                              `problem/${problems.some((p) => p.id === last) ? last : problems[0].id}`,
                            );
                          }
                        : startContest
                    }
                  >
                    <Play size={16} />
                    {contestActive ? "继续虚拟比赛" : "开启虚拟比赛"}
                  </button>
                  <button
                    className="button quiet"
                    onClick={() => nav("problems")}
                  >
                    浏览题目
                    <ChevronRight size={16} />
                  </button>
                  <a
                    className="button quiet"
                    href={contest.pdf}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={16} />
                    题面 PDF
                  </a>
                </div>
                <div className="contest-preview-footer">
                  <span>自测进度</span>
                  <span>
                    {passed.size} / {problems.length}
                  </span>
                </div>
              </div>
            </section>
          )}
          {!problem && route === "problems" && (
            <>
              <div className="contest-heading">
                <div>
                  <div className="eyebrow">
                    <span className="purple-line" />
                    {contest.englishTitle}
                  </div>
                  <h1>{contest.title}</h1>
                </div>
                <span className="outline-pill">
                  <Terminal size={14} />
                  个人自测
                </span>
              </div>
              <div className="overview-grid">
                <section className="problem-list-panel">
                  <div className="list-toolbar">
                    <div>
                      <span className="section-title">题目</span>
                      <span className="counter">{problems.length}</span>
                    </div>
                    <label className="search">
                      <Search size={15} />
                      <input
                        aria-label="搜索题目"
                        placeholder="搜索题号 / 标题"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <kbd>/</kbd>
                    </label>
                  </div>
                  <div className="problem-table">
                    <div className="table-head">
                      <span>题号</span>
                      <span>题目</span>
                      <span>时限</span>
                      <span>内存</span>
                      <span>自测</span>
                    </div>
                    {problems
                      .filter((p) =>
                        [p.id, p.title, p.englishTitle].some((x) =>
                          x.toLowerCase().includes(query.toLowerCase()),
                        ),
                      )
                      .map((p) => (
                        <div className="problem-row" key={p.id}>
                          <button
                            className={`problem-letter color-${p.id}`}
                            onClick={() => nav(`problem/${p.id}`)}
                            aria-label={`打开 ${p.id} ${p.title}`}
                          >
                            {p.id}
                          </button>
                          <button
                            className="problem-name"
                            onClick={() => nav(`problem/${p.id}`)}
                          >
                            <strong>{p.title}</strong>
                            <small>{p.englishTitle}</small>
                          </button>
                          <span className="limit mono">
                            {p.timeLimit / 1000} s
                          </span>
                          <span className="limit mono">{p.memoryLimit} MB</span>
                          <span className="row-status">
                            {passed.has(p.id) ? (
                              <Check size={17} className="green" />
                            ) : (
                              <span className="dash">—</span>
                            )}
                          </span>
                        </div>
                      ))}
                    {!problems.some((p) =>
                      [p.id, p.title, p.englishTitle].some((x) =>
                        x.toLowerCase().includes(query.toLowerCase()),
                      ),
                    ) && <div className="empty-search">没有匹配的题目</div>}
                  </div>
                  <div className="table-footer">
                    <span>{problems.length} problems</span>
                    <span>标准输入 / 标准输出</span>
                  </div>
                </section>
                <aside className="contest-aside">
                  {timerCard}
                  <div className="progress-card">
                    <div className="card-label">
                      自测进度
                      <span className="mono">
                        {passed.size} / {problems.length}
                      </span>
                    </div>
                    <div className="progress-number">
                      {passed.size}
                      <small> / {problems.length}</small>
                    </div>
                    <div className="progress-blocks">
                      {problems.map((p) => (
                        <span
                          title={`${p.id} ${p.title}`}
                          className={passed.has(p.id) ? "done" : ""}
                          key={p.id}
                        >
                          {p.id}
                        </span>
                      ))}
                    </div>
                    <div className="progress-meta">测试点通过数</div>
                  </div>
                  <div className="resource-card">
                    <div className="card-label">比赛资料</div>
                    <a
                      className="resource-link"
                      href={contest.pdf}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText size={18} />
                      <span>
                        完整题面
                        <small>{problems.length} 题 · ICPC 格式 PDF</small>
                      </span>
                      <Download size={16} />
                    </a>
                    <a
                      className="resource-link"
                      href={contest.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Trophy size={18} />
                      <span>
                        {contest.sourceLabel}
                        <small>原比赛题目</small>
                      </span>
                      <ChevronRight size={16} />
                    </a>
                  </div>
                  <p className="scope-note">
                    <span className="connection-dot" />
                    代码在你的浏览器内运行
                    <br />
                    每题 15 个自测点，其中 3 个 trick。
                  </p>
                </aside>
              </div>
            </>
          )}
          {problem && (
            <>
              <div className="problem-toolbar">
                <button
                  className="button quiet back"
                  onClick={() => nav("problems")}
                >
                  <ArrowLeft size={15} />
                  题目
                </button>
                <strong>
                  <span>{problem.id}.</span> {problem.title}
                </strong>
                <div className="problem-limits">
                  {contestActive && (
                    <span className="zen-timer">
                      <Clock size={14} />
                      {formatTime(remaining)}
                    </span>
                  )}
                  <span>{problem.timeLimit / 1000} s</span>
                  <span>{problem.memoryLimit} MB</span>
                  <a
                    className="button quiet"
                    href={problemPdf(contest, problem)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={15} />
                    PDF
                  </a>
                </div>
                {zen && (
                  <div className="zen-tools">
                    <button
                      className="icon-button"
                      aria-label="字体设置"
                      title="字体设置"
                      onClick={() => setSettings(true)}
                    >
                      Aa
                    </button>
                    <button
                      className="icon-button"
                      aria-label="退出禅模式"
                      title="退出禅模式 · Esc"
                      onClick={() => setZen(false)}
                    >
                      <Minimize2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="workbench">
                <section className="statement-pane">
                  <div className="pane-header">
                    <button
                      className={
                        view === "statement" ||
                        (problem.statementFormat === "pdf" && view === "pdf")
                          ? "pane-tab active"
                          : "pane-tab"
                      }
                      onClick={() =>
                        setView(
                          problem.statementFormat === "pdf"
                            ? "pdf"
                            : "statement",
                        )
                      }
                    >
                      题面
                    </button>
                    {problem.statementFormat !== "pdf" && (
                      <button
                        className={
                          view === "pdf" ? "pane-tab active" : "pane-tab"
                        }
                        onClick={() => setView("pdf")}
                      >
                        PDF
                      </button>
                    )}
                    <a
                      href={problem.qoj}
                      target="_blank"
                      rel="noreferrer"
                      className="original-link"
                    >
                      原题
                      <ChevronRight size={12} />
                    </a>
                  </div>
                  {view === "pdf" ? (
                    <iframe
                      title={`${problem.id} 题面 PDF`}
                      src={`${problemPdf(contest, problem)}#zoom=${Math.round((fonts.statement / 17) * 100)}`}
                    />
                  ) : (
                    <article className="statement">
                      <div className="paper-heading">
                        <small>Problem {problem.id}</small>
                        <h2>{problem.title}</h2>
                        {problem.englishTitle !== problem.title && (
                          <p>{problem.englishTitle}</p>
                        )}
                      </div>
                      <Markdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {problem.markdown.split("\n\n## Note\n\n")[0]}
                      </Markdown>
                      <h2>Examples</h2>
                      {problem.samples.map((s, i) => (
                        <div className="sample" key={i}>
                          <div className="sample-title">
                            Sample {i + 1}
                            <button
                              onClick={() => {
                                setInput(
                                  problem.checker === "hidden-track"
                                    ? problem.tests![0].input
                                    : s.input,
                                );
                                setExpected(
                                  problem.checker === "hidden-track"
                                    ? ""
                                    : s.output,
                                );
                                setTestMode("custom");
                                setResult(null);
                              }}
                            >
                              <Play size={12} />
                              {problem.checker === "hidden-track"
                                ? "交互自测"
                                : "载入"}
                            </button>
                          </div>
                          <div className="sample-grid">
                            <div>
                              <label>标准输入</label>
                              <pre>{s.input}</pre>
                            </div>
                            <div>
                              <label>标准输出</label>
                              <pre>{s.output}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                      {problem.markdown.includes("\n\n## Note\n\n") && (
                        <>
                          <h2>Note</h2>
                          <Markdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {problem.markdown
                              .split("\n\n## Note\n\n")
                              .slice(1)
                              .join("\n\n## Note\n\n")}
                          </Markdown>
                        </>
                      )}
                      <div className="statement-source">
                        题面来源：
                        <a
                          href={problem.source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {contest.id === DEFAULT_CONTEST
                            ? "洛谷官方重现赛"
                            : "QOJ"}
                        </a>{" "}
                        {problem.codeforces && (
                          <>
                            {" "}
                            ·{" "}
                            <a
                              href={problem.codeforces}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Codeforces
                            </a>
                          </>
                        )}
                      </div>
                    </article>
                  )}
                </section>
                <section className="editor-pane">
                  <div className="pane-header">
                    <div className="filename">
                      <Code2 size={15} />
                      {language === "cpp" ? "main.cpp" : "main.py"}
                      <span className="saved-label">已自动保存</span>
                    </div>
                    <select
                      aria-label="语言"
                      value={language}
                      disabled={!!busy}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                    >
                      <option value="cpp">C++17 · Clang WASM</option>
                      <option value="python">Python · Pyodide</option>
                    </select>
                    <button
                      title="下载代码"
                      aria-label="下载代码"
                      className="icon-button"
                      onClick={() =>
                        download(
                          `${problem.id}.${language === "cpp" ? "cpp" : "py"}`,
                          code,
                        )
                      }
                    >
                      <Download size={15} />
                    </button>
                  </div>
                  <div className="code-area">
                    <CodeMirror
                      value={code}
                      height="100%"
                      theme={theme === "dark" ? "dark" : "light"}
                      extensions={[
                        language === "cpp" ? cpp() : python(),
                        codeTheme,
                      ]}
                      onChange={(value) => {
                        setCode(value);
                        save(draftKey(problem.id, language), value);
                      }}
                      basicSetup={{
                        foldGutter: false,
                        highlightActiveLine: true,
                      }}
                    />
                  </div>
                  <div className="run-bar">
                    <span>
                      <span className="connection-dot" />
                      本地运行<span className="run-limit">10 s / case</span>
                    </span>
                    <button
                      className="button quiet"
                      disabled={!!busy}
                      onClick={() => run(false)}
                    >
                      <Play size={14} />
                      运行
                    </button>
                    <button
                      className="button primary"
                      disabled={!!busy}
                      onClick={() => run(true)}
                    >
                      <Check size={14} />
                      提交自测
                    </button>
                  </div>
                  <div className="test-panel">
                    <div className="pane-header">
                      <Terminal size={15} />
                      <strong>测试</strong>
                      <div className="segmented">
                        <button
                          disabled={!!busy}
                          className={testMode === "samples" ? "active" : ""}
                          onClick={() => {
                            setTestMode("samples");
                            setResult(null);
                          }}
                        >
                          全部测试点
                        </button>
                        <button
                          disabled={!!busy}
                          className={testMode === "custom" ? "active" : ""}
                          onClick={() => {
                            setTestMode("custom");
                            setResult(null);
                          }}
                        >
                          自定义
                        </button>
                      </div>
                    </div>
                    {busy ? (
                      <div className="running">
                        <span className="spinner" />
                        {phaseText[busy]}
                        <span className="mono">
                          {testProgress.current} / {testProgress.total}
                        </span>
                        <small>首次加载 C++ 约 60 MB，Python 约 12 MB。</small>
                      </div>
                    ) : result ? (
                      <div className="test-results">
                        {result.map((r, i) => (
                          <details
                            key={i}
                            open={!["PASS", "SKIP"].includes(r.status)}
                          >
                            <summary>
                              <span title={problem.tests?.[i]?.label}>
                                Test {i + 1}
                                {problem.tests?.[i]?.kind === "trick" && (
                                  <small className="trick-tag">trick</small>
                                )}
                              </span>
                              {badge(r.status)}
                              <span className="mono timing">
                                {r.time.toFixed(1)} ms
                              </span>
                              <ChevronDown size={14} />
                            </summary>
                            <div className="output-label">标准输出</div>
                            <pre>{r.output || "(empty)"}</pre>
                            {r.error && (
                              <pre className="error-output">{r.error}</pre>
                            )}
                            {r.status === "WA" &&
                              problem.checker !== "hidden-track" && (
                                <>
                                  <div className="output-label">预期输出</div>
                                  <pre>
                                    {testMode === "samples"
                                      ? (problem.tests || problem.samples)[i]
                                          .output
                                      : expected}
                                  </pre>
                                </>
                              )}
                          </details>
                        ))}
                        <p className="test-scope">
                          浏览器自测结果；时间、内存与原赛环境不同。
                        </p>
                      </div>
                    ) : testMode === "custom" ? (
                      <div className="custom-inputs">
                        <label>
                          {problem.checker === "hidden-track"
                            ? "隐藏排列 · T，n，排列（0 起始）"
                            : "标准输入"}
                          <textarea
                            aria-label="标准输入"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            spellCheck={false}
                          />
                        </label>
                        {problem.checker !== "hidden-track" && (
                          <label>
                            预期输出 <span>可留空</span>
                            <textarea
                              aria-label="预期输出"
                              value={expected}
                              onChange={(e) => setExpected(e.target.value)}
                              spellCheck={false}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="test-placeholder">
                        <div className="test-cases">
                          {(problem.tests || problem.samples).map((test, i) => (
                            <span
                              key={i}
                              title={
                                "label" in test
                                  ? String(test.label)
                                  : `Sample ${i + 1}`
                              }
                            >
                              {"kind" in test && test.kind === "trick"
                                ? "Trick"
                                : "Test"}{" "}
                              {i + 1}
                              <span className="dash">—</span>
                            </span>
                          ))}
                        </div>
                        <p>
                          运行全部 {(problem.tests || problem.samples).length}{" "}
                          个测试点 <kbd>Ctrl + Enter</kbd>
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
          {!problem && route === "submissions" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">LOCAL HISTORY</div>
                <h1>提交记录</h1>
                <p>保存于当前浏览器 · 最近 500 条</p>
              </div>
              <section className="history-panel">
                <div className="history-head">
                  <span>题目</span>
                  <span>结果</span>
                  <span>测试点</span>
                  <span>语言</span>
                  <span>用时</span>
                  <span>提交时间</span>
                </div>
                {history.length ? (
                  history.map((s) => (
                    <button
                      key={s.id}
                      className="history-row"
                      onClick={() => setDetail(s)}
                    >
                      <span>
                        <b>{s.problem}</b>{" "}
                        {problems.find((p) => p.id === s.problem)?.title}
                      </span>
                      <span>{badge(s.status)}</span>
                      <span className="mono">
                        {s.passed} / {s.total}
                      </span>
                      <span>{s.language === "cpp" ? "C++17" : "Python"}</span>
                      <span className="mono">{s.time.toFixed(1)} ms</span>
                      <span>
                        {new Date(s.at).toLocaleString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    <History size={34} />
                    <h3>还没有提交</h3>
                    <p>选择一道题，提交你的第一次自测。</p>
                    <button
                      className="button primary"
                      onClick={() => nav("problem/C")}
                    >
                      打开题目 C
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          {!problem && route === "standings" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">VIRTUAL CONTEST</div>
                <h1>自测榜</h1>
                <p>本次虚拟比赛 · 仅统计本站自测数据</p>
              </div>
              <div className="standings-toolbar">
                <span className="outline-pill">
                  <Clock size={14} />
                  {session ? formatTime(remaining) : "尚未开始比赛"}
                </span>
                <span>罚时 20 分钟 · CE 不计罚时</span>
              </div>
              <div className="standings-scroll">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>选手</th>
                      <th>通过</th>
                      <th>罚时</th>
                      {problems.map((p) => (
                        <th key={p.id}>{p.id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>
                        <b>{profile}</b>
                        <small>本地选手</small>
                      </td>
                      <td className="green mono">{contestPassed.size}</td>
                      <td className="mono">{totalPenalty}</td>
                      {problems.map((p) => {
                        const s = score(p.id);
                        return (
                          <td
                            key={p.id}
                            className={
                              s.solved
                                ? "solved-cell"
                                : s.attempts
                                  ? "attempted-cell"
                                  : ""
                            }
                          >
                            {s.solved ? (
                              <>
                                <b>+{s.attempts > 1 ? s.attempts - 1 : ""}</b>
                                <small>{s.minute}</small>
                              </>
                            ) : s.attempts ? (
                              `−${s.attempts}`
                            ) : (
                              "·"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="standings-legend">
                <span>
                  <i className="legend solved" />
                  自测通过
                </span>
                <span>
                  <i className="legend attempted" />
                  尚未通过
                </span>
              </div>
            </>
          )}
          {!problem &&
            !["contests", "problems", "submissions", "standings"].includes(
              route,
            ) && (
              <div className="empty-state">
                <FileText size={30} />
                <h3>页面不存在</h3>
                <button
                  className="button primary"
                  onClick={() => nav("problems")}
                >
                  返回题目
                </button>
              </div>
            )}
        </main>
        <footer className="statusbar">
          <span>
            <span className="connection-dot" />
            Browser runtime
          </span>
          <span className="status-scope">15 个自测点 · 3 个 trick</span>
          <span className="status-spacer" />
          <span>{language === "cpp" ? "C++17" : "Python"}</span>
          <span>UTF-8</span>
          <button onClick={() => setSettings(true)}>
            <Settings size={12} />
            设置
          </button>
        </footer>
      </div>
      {route !== "contests" && !(zen && problem) && (
        <div className="zen-floating">
          {zen && (
            <button
              className="icon-button"
              aria-label="字体设置"
              title="字体设置"
              onClick={() => setSettings(true)}
            >
              Aa
            </button>
          )}
          <button
            className={`zen-toggle ${zen ? "is-zen" : ""}`}
            aria-label={zen ? "退出禅模式" : "进入禅模式"}
            onClick={() => setZen((v) => !v)}
          >
            {zen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {zen ? "退出禅模式" : "禅模式"}
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button aria-label="关闭通知" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {settings && (
        <div className="modal-overlay" onClick={() => setSettings(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="设置"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>工作区设置</h2>
              <button aria-label="关闭设置" onClick={() => setSettings(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="font-controls">
              <div className="font-controls-heading">
                <span>字体大小</span>
                <button
                  className="button quiet"
                  onClick={() => setFonts(defaultFonts)}
                >
                  重置
                </button>
              </div>
              {(
                [
                  ["ui", "界面"],
                  ["statement", "题面"],
                  ["code", "代码"],
                ] as const
              ).map(([key, label]) => (
                <label className="font-control" key={key}>
                  <span>{label}</span>
                  <input
                    type="range"
                    aria-label={`${label}字体大小`}
                    min={fontLimits[key][0]}
                    max={fontLimits[key][1]}
                    step="1"
                    value={fonts[key]}
                    onChange={(e) =>
                      setFonts((f) => ({ ...f, [key]: Number(e.target.value) }))
                    }
                  />
                  <output>{fonts[key]} px</output>
                </label>
              ))}
              <div className="font-preview">Aa · 辽宁省赛 · ICPC 2026</div>
            </div>
            <label className="setting-label">
              选手名称
              <input
                value={profile}
                maxLength={32}
                onChange={(e) => setProfile(e.target.value)}
              />
            </label>
            <div className="setting-row">
              <div>
                本地数据<small>代码、提交记录、比赛进度</small>
              </div>
              <button className="button quiet" onClick={backup}>
                <Download size={14} />
                导出
              </button>
              <button
                className="button quiet"
                onClick={() => upload.current?.click()}
              >
                <Upload size={14} />
                导入
              </button>
              <input
                ref={upload}
                hidden
                type="file"
                accept="application/json,.json"
                onChange={(e) => restore(e.target.files?.[0])}
              />
            </div>
            <div className="setting-shortcuts">
              <span>运行自测点</span>
              <kbd>Ctrl + Enter</kbd>
              <span>提交自测</span>
              <kbd>Ctrl + Shift + Enter</kbd>
            </div>
            <p className="modal-note">
              代码只在当前设备的浏览器里执行。清除浏览器数据前，请先导出备份。自测通过不代表官方完整数据通过。
            </p>
            <button
              className="button primary full"
              onClick={() => setSettings(false)}
            >
              完成
            </button>
          </section>
        </div>
      )}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <section
            className="modal submission-detail"
            role="dialog"
            aria-modal="true"
            aria-label="提交详情"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{detail.problem} · 提交详情</h2>
              <button aria-label="关闭提交详情" onClick={() => setDetail(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="detail-meta">
              {badge(detail.status)}
              <span>
                {detail.passed}/{detail.total} 测试点
              </span>
              <span>{detail.language === "cpp" ? "C++17" : "Python"}</span>
            </div>
            <pre>{detail.source}</pre>
            <div className="detail-actions">
              <button
                className="button quiet"
                onClick={() =>
                  download(
                    `${detail.contestId}-${detail.problem}.${detail.language === "cpp" ? "cpp" : "py"}`,
                    detail.source,
                  )
                }
              >
                <Download size={14} />
                下载代码
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setLanguage(detail.language);
                  save(
                    draftKey(detail.problem, detail.language, detail.contestId),
                    detail.source,
                  );
                  nav(`problem/${detail.problem}`, detail.contestId);
                  setCode(detail.source);
                  setDetail(null);
                }}
              >
                在编辑器打开
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
