export type Language = "cpp" | "python";
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
  checker: string;
}
export interface RunResult {
  status: string;
  output: string;
  error?: string;
  time: number;
}
export interface Submission {
  id: string;
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
