export type Language = "cpp" | "cpp20" | "cpp23" | "python" | "pypy3";
export interface TestCase {
  input: string;
  output: string;
  label: string;
  kind: "sample" | "regular" | "trick";
  file?: string;
  sha256?: string;
  inputBytes?: number;
  outputBytes?: number;
  maxOutputBytes?: number;
}
export interface Problem {
  id: string;
  title: string;
  englishTitle: string;
  timeLimit: number;
  memoryLimit: number;
  source: string;
  qoj: string;
  codeforces: string;
  markdown: string;
  samples: { input: string; output: string }[];
  tests?: TestCase[];
  checker: string;
  pdf?: string;
  statementFormat?: "markdown" | "pdf";
}
export interface Contest {
  id: string;
  title: string;
  shortTitle: string;
  englishTitle: string;
  date: string;
  duration: number;
  pdf: string;
  source: string;
  sourceLabel: string;
  problems: Problem[];
}
export interface FontSettings {
  ui: number;
  statement: number;
  code: number;
}
export interface RunResult {
  status: string;
  output: string;
  error?: string;
  time: number;
  expected?: string;
}
export interface Submission {
  id: string;
  contestId: string;
  problem: string;
  language: Language;
  source: string;
  at: number;
  status: string;
  passed: number;
  total: number;
  time: number;
  contestStart: number | null;
  details: RunResult[];
}
export interface Session {
  start: number;
  end: number | null;
}
