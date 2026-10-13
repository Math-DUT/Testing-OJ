import liaoning from "./problems.json";
import online1 from "./data/icpc-online-2026-1.json";
import online2 from "./data/icpc-online-2026-2.json";
import shenyang from "./data/icpc-shenyang-2025.json";
import shanghai from "./data/icpc-shanghai-2025.json";
import type { Contest, Problem } from "./types";

export const DEFAULT_CONTEST = "lncpc-2025";
export const contests: Contest[] = [
  {
    id: DEFAULT_CONTEST,
    title: "辽宁省赛 2025",
    shortTitle: "辽宁省赛 2025",
    englishTitle: "The 6th Liaoning Provincial Collegiate Programming Contest",
    date: "2025-11-15",
    duration: 5 * 60 * 60 * 1000,
    pdf: "./pdf/LNCPC-2025.pdf",
    source: "https://codeforces.com/gym/106380",
    sourceLabel: "Codeforces Gym",
    problems: liaoning as Problem[],
  },
  {
    id: "icpc-online-2026-1",
    title: "ICPC 网络赛 2026 · 第一场",
    shortTitle: "2026 网络赛 I",
    englishTitle: "The 2026 ICPC Asia East Continent Online Contest (I)",
    date: "2026-09-06",
    duration: 5 * 60 * 60 * 1000,
    pdf: "./pdf/icpc-online-2026-1/problemset.pdf",
    source: "https://qoj.ac/contest/4071",
    sourceLabel: "QOJ",
    problems: online1 as Problem[],
  },
  {
    id: "icpc-online-2026-2",
    title: "ICPC 网络赛 2026 · 第二场",
    shortTitle: "2026 网络赛 II",
    englishTitle: "The 2026 ICPC Asia East Continent Online Contest (II)",
    date: "2026-09-12",
    duration: 5 * 60 * 60 * 1000,
    pdf: "./pdf/icpc-online-2026-2/problemset.pdf",
    source: "https://qoj.ac/contest/4113",
    sourceLabel: "QOJ",
    problems: online2 as Problem[],
  },
  {
    id: "icpc-shenyang-2025",
    title: "ICPC 区域赛 2025 · 沈阳站",
    shortTitle: "2025 沈阳站",
    englishTitle: "The 2025 ICPC Asia Shenyang Regional Contest",
    date: "2025-11-16",
    duration: 5 * 60 * 60 * 1000,
    pdf: "./pdf/icpc-shenyang-2025/problemset.pdf",
    source: "https://codeforces.com/gym/106252",
    sourceLabel: "Codeforces Gym",
    problems: shenyang as Problem[],
  },
  {
    id: "icpc-shanghai-2025",
    title: "ICPC 区域赛 2025 · 上海站",
    shortTitle: "2025 上海站",
    englishTitle: "The 2025 ICPC Asia Shanghai Regional Contest",
    date: "2025-11-23",
    duration: 5 * 60 * 60 * 1000,
    pdf: "./pdf/icpc-shanghai-2025/problemset.pdf",
    source: "https://qoj.ac/contest/2645",
    sourceLabel: "QOJ",
    problems: shanghai as Problem[],
  },
];

export function parseRoute(hash: string) {
  const route = hash.replace(/^#/, "");
  if (!route || route === "contests")
    return { view: "contests", contestId: null };
  const match = /^contest\/([^/]+)(?:\/(.*))?$/.exec(route);
  if (match && contests.some((c) => c.id === match[1]))
    return { contestId: match[1], view: match[2] || "problems" };
  // Keep links from the first public release working.
  if (/^(problems|submissions|standings|problem\/[A-M])$/.test(route))
    return { contestId: DEFAULT_CONTEST, view: route };
  return { contestId: null, view: "missing" };
}

export function problemPdf(contest: Contest, problem: Problem) {
  return problem.pdf || `./pdf/${problem.id}.pdf`;
}
